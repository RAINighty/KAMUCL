import type {MascotSound} from '@shared/mascots'

/** Original palm slap: a dry broadband crack, short skin-like body, no sample library. */
export function slapSamples(sampleRate:number):Float32Array {
 const samples=new Float32Array(Math.ceil(sampleRate*.075));let seed=0x6b616d75,low=0,presence=0
 const lowAlpha=Math.exp(-2*Math.PI*260/sampleRate),presenceAlpha=Math.exp(-2*Math.PI*5200/sampleRate)
 for(let i=0;i<samples.length;i++){
  seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5
  const t=i/sampleRate,noise=(seed>>>0)/0x80000000-1
  low=low*lowAlpha+noise*(1-lowAlpha);presence=presence*presenceAlpha+(noise-low)*(1-presenceAlpha)
  const attack=Math.min(1,t/.0007),crack=(noise-low)*.62*Math.exp(-t*180),smack=presence*.45*Math.exp(-t*67)
  const body=Math.sin(2*Math.PI*(150*t-400*t*t))*.07*Math.exp(-t*105)
  samples[i]=attack*(crack+smack+body)
 }
 const peak=samples.reduce((value,sample)=>Math.max(value,Math.abs(sample)),0)
 if(peak>.92)for(let i=0;i<samples.length;i++)samples[i]*=.92/peak
 return samples
}
export class MascotAudio {
 private context?:AudioContext;private buffer?:AudioBuffer;private gain?:GainNode
 private primer?:ConstantSourceNode;private primed=false
 private voices=new Set<AudioBufferSourceNode>();private next=0;private played=0;private closed=false;private paused=false
 private suspending?:Promise<void>
 constructor(private prefs:()=>MascotSound,private stats:(played:number,voices:number)=>void,private active:()=>boolean=()=>true){}
 private allowed(){return!this.closed&&!this.paused&&this.active()}
 private stateChanged=()=>{if(this.context?.state==='running'&&!this.allowed())this.suspend(this.context)}
 private stopPrimer(){
  const source=this.primer;if(!source)return;this.primer=undefined;source.onended=null
  try{source.stop()}catch{}source.disconnect()
 }
 private primeOutput(context:AudioContext){
  if(this.primed||!this.gain||!this.allowed()||context.state!=='running')return
  // The first real LOGO activation opens the native output graph once. This
  // source is exactly digital silence, never a slap or an extra queued contact.
  const source=context.createConstantSource(),when=context.currentTime
  source.offset.value=0;source.connect(this.gain);this.primer=source
  source.onended=()=>{source.disconnect();if(this.primer===source)this.primer=undefined}
  try{source.start(when);source.stop(when+.05);this.primed=true}catch(error){this.stopPrimer();throw error}
 }
 private suspend(context:AudioContext){
  if(context.state==='closed'||this.suspending)return
  // A pending resume can finish after suspend. Guard both the resulting state
  // event and the completed operation, without spinning on an unavailable device.
  const pending=context.suspend().then(()=>{
   if(this.suspending===pending)this.suspending=undefined
   if(context===this.context&&!this.allowed()&&context.state==='running')this.suspend(context)
  },()=>{if(this.suspending===pending)this.suspending=undefined})
  this.suspending=pending
 }
 async unlock(){
  if(this.closed||!this.active()){if(this.context)this.suspend(this.context);return}
  this.paused=false
  try{
   if(!this.context){
    const context=this.context=new AudioContext({latencyHint:'interactive'})
    context.addEventListener('statechange',this.stateChanged)
    this.buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.075),context.sampleRate)
    this.buffer.copyToChannel(new Float32Array(slapSamples(context.sampleRate)),0)
    const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=10;limiter.ratio.value=8;limiter.attack.value=.001;limiter.release.value=.04
    this.gain=context.createGain();this.gain.connect(limiter);limiter.connect(context.destination)
   }
   const context=this.context
   // A quick foreground transition can overtake an earlier suspend request.
   // Finish that request before deciding whether the current context needs resume.
   if(this.suspending)await this.suspending
   if(!this.allowed()){this.suspend(context);return}
   if(context.state==='suspended')await context.resume()
   if(!this.allowed())this.suspend(context)
   else this.primeOutput(context)
  }catch{/* Audio device availability must not block interaction or persistence. */}
 }
 /** Returns the visual-clock delay to the very same scheduled contact sound. */
 play(approachMs=0):number {
  const prefs=this.prefs(),context=this.context
  const lead=Math.max(0,Math.min(150,approachMs))/1000
  if(!this.allowed()||prefs.muted||!prefs.volume||!context||context.state!=='running'||!this.buffer||!this.gain)return lead*1000
  this.gain.gain.setTargetAtTime(prefs.volume*.75,context.currentTime,.004)
  const source=context.createBufferSource();source.buffer=this.buffer;source.playbackRate.value=1+(this.played%5-2)*.025;source.connect(this.gain)
  if(this.voices.size>=24){const oldest=this.voices.values().next().value;try{oldest?.stop()}catch{}}
  this.voices.add(source)
  source.onended=()=>{source.disconnect();this.voices.delete(source);this.stats(this.played,this.voices.size)}
  // One sparse pointer event can cross all seven hips. Spread the pops into a
  // short roll instead of combining seven identical samples into one loud pop.
  const earliest=context.currentTime+lead,start=Math.max(earliest,Math.min(this.next,earliest+.12))
  this.next=start+.015;source.start(start);this.played++;this.stats(this.played,this.voices.size)
  return (start-context.currentTime)*1000
 }
 update(){if(this.gain&&this.context)this.gain.gain.setTargetAtTime(this.prefs().muted?0:this.prefs().volume*.75,this.context.currentTime,.004)}
 pause(){this.paused=true;this.next=0;this.stopPrimer();for(const source of this.voices){try{source.stop()}catch{}}if(this.context)this.suspend(this.context)}
 async dispose(){this.closed=true;this.pause();const context=this.context;await context?.close().catch(()=>{});context?.removeEventListener('statechange',this.stateChanged);this.context=undefined;this.buffer=undefined;this.gain=undefined}
}
