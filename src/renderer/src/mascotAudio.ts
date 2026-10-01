import type {MascotSound} from '@shared/mascots'

/** Original, synthesized palm-pop: no downloaded or third-party audio samples. */
export function slapSamples(sampleRate:number):Float32Array {
 const samples=new Float32Array(Math.ceil(sampleRate*.075));let seed=0x6b616d75,low=0
 for(let i=0;i<samples.length;i++){
  seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5
  const t=i/sampleRate,noise=(seed>>>0)/0x80000000-1
  low=low*.78+noise*.22
  const attack=Math.min(1,t/.0015),decay=Math.exp(-t*75)
  samples[i]=attack*decay*(noise*.52+low*.26+Math.sin(2*Math.PI*(240*t-750*t*t))*.22)
 }
 return samples
}
export class MascotAudio {
 private context?:AudioContext;private buffer?:AudioBuffer;private gain?:GainNode
 private voices=new Set<AudioBufferSourceNode>();private next=0;private played=0;private closed=false
 constructor(private prefs:()=>MascotSound,private stats:(played:number,voices:number)=>void){}
 async unlock(){
  if(this.closed)return
  try{
   if(!this.context){
    const context=this.context=new AudioContext({latencyHint:'interactive'})
    this.buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.075),context.sampleRate)
    this.buffer.copyToChannel(new Float32Array(slapSamples(context.sampleRate)),0)
    const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=10;limiter.ratio.value=8;limiter.attack.value=.001;limiter.release.value=.04
    this.gain=context.createGain();this.gain.connect(limiter);limiter.connect(context.destination)
   }
   if(this.context.state==='suspended')await this.context.resume()
  }catch{/* Audio device availability must not block interaction or persistence. */}
 }
 play(){
  const prefs=this.prefs(),context=this.context
  if(this.closed||prefs.muted||!prefs.volume||!context||context.state!=='running'||!this.buffer||!this.gain)return
  this.gain.gain.setTargetAtTime(prefs.volume*.75,context.currentTime,.004)
  const source=context.createBufferSource();source.buffer=this.buffer;source.playbackRate.value=1+(this.played%5-2)*.025;source.connect(this.gain)
  if(this.voices.size>=24){const oldest=this.voices.values().next().value;try{oldest?.stop()}catch{}}
  this.voices.add(source)
  source.onended=()=>{source.disconnect();this.voices.delete(source);this.stats(this.played,this.voices.size)}
  // One sparse pointer event can cross all seven hips. Spread the pops into a
  // short roll instead of combining seven identical samples into one loud pop.
  const start=Math.max(context.currentTime,Math.min(this.next,context.currentTime+.12))
  this.next=start+.015;source.start(start);this.played++;this.stats(this.played,this.voices.size)
 }
 update(){if(this.gain&&this.context)this.gain.gain.setTargetAtTime(this.prefs().muted?0:this.prefs().volume*.75,this.context.currentTime,.004)}
 pause(){this.next=0;for(const source of this.voices){try{source.stop()}catch{}}void this.context?.suspend().catch(()=>{})}
 async dispose(){this.closed=true;this.pause();await this.context?.close().catch(()=>{});this.context=undefined;this.buffer=undefined;this.gain=undefined}
}
