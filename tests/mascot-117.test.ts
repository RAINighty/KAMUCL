import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {createRequire} from 'node:module'
import {build} from 'esbuild'
import sharp from 'sharp'
import {MASCOTS,MascotSweepGate,addMascotHits,mascotHull,mascotShapeContains,mascotWalkFrame,normalizeMascotSound,type MascotHitRect} from '../src/shared/mascots'
import {MascotAudio,slapSamples} from '../src/renderer/src/mascotAudio'

const rectangles:MascotHitRect[]=MASCOTS.map((m,index)=>({id:m.id,left:20+index*30,right:40+index*30,top:10,bottom:24}))
test('a sparse pointer sweep intersects all seven hip zones in travel order',()=>{
 const gate=new MascotSweepGate();assert.deepEqual(gate.move(0,17,rectangles),[])
 assert.deepEqual(gate.move(250,17,rectangles),MASCOTS.map(m=>m.id))
 assert.deepEqual(gate.move(0,17,rectangles),MASCOTS.map(m=>m.id).reverse())
 gate.reset();assert.deepEqual(gate.move(0,50,rectangles),[]);assert.deepEqual(gate.move(250,50,rectangles),[])
})
test('staying inside, stationary reorder, and a sorting character under the pointer do not slap',()=>{
 const gate=new MascotSweepGate();assert.deepEqual(gate.move(25,15,rectangles),['q3']);assert.deepEqual(gate.move(26,15,rectangles),[])
 const swapped=rectangles.map((r,i)=>({...r,id:i===0?'qiqi':i===1?'q3':r.id}))
 assert.deepEqual(gate.move(26,15,swapped),[]);assert.deepEqual(gate.move(27,15,swapped),[])
 assert.deepEqual(gate.move(0,15,swapped),[]);assert.deepEqual(gate.move(30,15,swapped),['qiqi'])
 gate.reset();assert.deepEqual(gate.move(35,15,swapped),['qiqi'])
})
test('coalesced intermediate points follow their trajectory instead of a false diagonal',()=>{
 const gate=new MascotSweepGate();gate.move(0,0,rectangles)
 assert.deepEqual(gate.move(100,0,rectangles),[]);assert.deepEqual(gate.move(100,17,rectangles),['biyuehu']);assert.deepEqual(gate.move(100,30,rectangles),[])
})
test('part silhouettes exclude empty bounding-box corners and dedupe a whole person',()=>{
 const polygon=mascotHull([{x:20,y:10},{x:30,y:0},{x:40,y:10},{x:30,y:20},{x:30,y:10}]),head={id:'q3',part:'head',left:20,right:40,top:0,bottom:20,polygon}
 assert.equal(polygon.length,4);assert.equal(mascotShapeContains(head,21,1),false);assert.equal(mascotShapeContains(head,30,10),true)
 const gate=new MascotSweepGate();gate.move(0,1,[head]);assert.deepEqual(gate.move(23,1,[head]),[],'empty corner does not slap')
 gate.reset();gate.move(0,10,[head]);assert.deepEqual(gate.move(50,10,[head,{...head,part:'body'}]),['q3'],'two parts crossing in one event are one entry')
 gate.reset();assert.deepEqual(gate.move(30,10,[head]),['q3']);assert.deepEqual(gate.move(31,10,[head,{...head,part:'arm'}]),[])
})
test('full-person sparse sweeps hit head, torso and feet separately without hitting gaps',()=>{
 const shapes=MASCOTS.flatMap((m,i)=>[{id:m.id,left:20+i*30,right:40+i*30,top:0,bottom:12,part:'head'},{id:m.id,left:24+i*30,right:36+i*30,top:12,bottom:38,part:'body'},{id:m.id,left:24+i*30,right:29+i*30,top:38,bottom:50,part:'leftLeg'},{id:m.id,left:31+i*30,right:36+i*30,top:38,bottom:50,part:'rightLeg'}])
 for(const y of [6,25,45]){const gate=new MascotSweepGate();gate.move(0,y,shapes);assert.deepEqual(gate.move(250,y,shapes),MASCOTS.map(m=>m.id))}
 const gate=new MascotSweepGate();assert.deepEqual(gate.move(30,45,shapes),[],'between legs is empty');assert.deepEqual(gate.move(30,55,shapes),[])
})
test('a passing figure occludes covered farther pixels, while visible farther edges remain hittable',()=>{
 const near={id:'q3',left:10,right:30,top:0,bottom:20,depth:-.5},far={id:'qiqi',left:10,right:30,top:0,bottom:20,depth:.5}
 const gate=new MascotSweepGate();gate.move(0,10,[near,far]);assert.deepEqual(gate.move(40,10,[near,far]),['q3'])
 gate.reset();gate.move(0,10,[near,{...far,right:35}]);assert.deepEqual(gate.move(40,10,[near,{...far,right:35}]),['q3','qiqi'])
 gate.reset();assert.deepEqual(gate.move(20,10,[near,far]),['q3'])
})
test('moving from a covered overlap onto an exposed farther edge is a fresh visible entry',()=>{
 const near={id:'near',left:0,right:8,top:0,bottom:20,depth:0},far={id:'far',left:4,right:12,top:0,bottom:20,depth:1},shapes=[near,far],gate=new MascotSweepGate()
 assert.deepEqual(gate.move(5,10,shapes),['near'],'only the front person occupies the overlap')
 assert.deepEqual(gate.move(10,10,shapes),['far'],'crossing x=8 enters the exposed farther pixels')
 assert.deepEqual(gate.move(15,10,shapes),[],'leaving the exposed person is not another slap')
 assert.deepEqual(gate.move(10,10,shapes),['far'],'a real reentry still counts once')
 assert.deepEqual(gate.move(11,10,shapes),[],'holding within visible farther pixels does not count')
 assert.deepEqual(gate.move(5,10,shapes),['near'],'returning across the front boundary hits the front person')
 assert.deepEqual(gate.move(5,10,[far,{...near,depth:2}]),[],'depth/geometry changing at a stationary pointer is not travel')
 assert.deepEqual(gate.move(5.5,10,[far,{...near,depth:2}]),[],'the now-visible person is rebased before the next real move')
})
test('overlap occupancy uses the nearest part of each person and preserves equal-depth visibility',()=>{
 const gate=new MascotSweepGate(),near={id:'near',left:0,right:8,top:0,bottom:20,depth:0},far={id:'far',left:4,right:12,top:0,bottom:20,depth:1}
 assert.deepEqual(gate.move(5,10,[{...near,part:'arm',depth:2},far,{...near,part:'head'}]),['near'])
 assert.deepEqual(gate.move(10,10,[{...near,part:'arm',depth:2},far,{...near,part:'head'}]),['far'])
 gate.reset();assert.deepEqual(gate.move(5,10,[near,{...far,depth:0}]),['near','far'],'depth ties are not falsely occluded')
})
test('sorting silhouettes alone cannot count, and real motion during sorting remains available',()=>{
 const gate=new MascotSweepGate(),shape={id:'q3',left:10,right:20,top:0,bottom:20}
 gate.move(30,10,[shape]);assert.deepEqual(gate.move(30,10,[{...shape,left:25,right:35}]),[])
 assert.deepEqual(gate.move(31,10,[{...shape,left:25,right:35}]),[],'new geometry is rebased under the cursor')
 gate.move(40,10,[{...shape,left:25,right:35}]);assert.deepEqual(gate.move(25,10,[{...shape,left:25,right:35}]),['q3'])
})
test('walking reaches exact targets, and retargeting can preserve position and travelled phase',()=>{
 assert.deepEqual(mascotWalkFrame(6,0,1000,1000),{position:0,progress:1,travelled:6,direction:-1,walking:false})
 const midway=mascotWalkFrame(6,0,400,1000),retarget=mascotWalkFrame(midway.position,2,0,500)
 assert.equal(retarget.position,midway.position);assert(midway.travelled>0&&midway.position>0);assert.equal(mascotWalkFrame(6,0,0,0).position,0)
 assert.equal(mascotWalkFrame(1,1,20,300).walking,false)
})
test('batched counts retain overflow bounds, stable ties, and sound migration defaults',()=>{
 const base={counts:{q3:Number.MAX_SAFE_INTEGER},order:MASCOTS.map(m=>m.id)}
 const next=addMascotHits(base,['qiqi','kamu','qiqi','q3']);assert.equal(next.counts.q3,Number.MAX_SAFE_INTEGER);assert.equal(next.counts.qiqi,2);assert.equal(base.counts.q3,Number.MAX_SAFE_INTEGER)
 assert.deepEqual(addMascotHits({counts:{},order:base.order},MASCOTS.map(m=>m.id)).order,base.order)
 assert.deepEqual(normalizeMascotSound(),{muted:false,volume:.45});assert.deepEqual(normalizeMascotSound({muted:true,volume:4}),{muted:true,volume:1});assert.equal(normalizeMascotSound({volume:NaN}).volume,.45)
})
test('original palm-pop waveform is deterministic, bounded, nonzero and fades out',()=>{
 const a=slapSamples(48000),b=slapSamples(48000);assert.deepEqual(a,b);assert.equal(a.length,3600)
 assert(a.every(n=>Number.isFinite(n)&&Math.abs(n)<1));assert(a.some(n=>Math.abs(n)>.25));assert(Math.max(...a.slice(-100).map(Math.abs))<.005)
})

class FakeMascotAudioContext extends EventTarget {
 state='suspended';sampleRate=48000;currentTime=0;destination={};resumeCalls=0;suspendCalls=0;sourceStarts=0;startTimes:number[]=[]
 deferResume=false;deferSuspend=false;pendingResume?:()=>void;pendingSuspend?:()=>void
 transition(state:string){this.state=state;this.dispatchEvent(new Event('statechange'))}
 createBuffer(){return{copyToChannel(){}}}
 createDynamicsCompressor(){return{threshold:{value:0},knee:{value:0},ratio:{value:0},attack:{value:0},release:{value:0},connect(){}}}
 createGain(){return{gain:{setTargetAtTime(){}},connect(){}}}
 createBufferSource(){const context=this;return{buffer:undefined,playbackRate:{value:1},onended:null as null|(()=>void),connect(){},disconnect(){},start(when=0){context.sourceStarts++;context.startTimes.push(when)},stop(){this.onended?.()}}}
 resume(){this.resumeCalls++;const finish=()=>{if(this.state!=='closed')this.transition('running')};if(this.deferResume)return new Promise<void>(resolve=>{this.pendingResume=()=>{finish();resolve()}});finish();return Promise.resolve()}
 suspend(){this.suspendCalls++;const finish=()=>{if(this.state!=='closed')this.transition('suspended')};if(this.deferSuspend)return new Promise<void>(resolve=>{this.pendingSuspend=()=>{finish();resolve()}});finish();return Promise.resolve()}
 close(){this.transition('closed');return Promise.resolve()}
}
async function fakeMascotAudio(run:(contexts:FakeMascotAudioContext[])=>Promise<void>,deferResume=false){
 const previous=Object.getOwnPropertyDescriptor(globalThis,'AudioContext'),contexts:FakeMascotAudioContext[]=[]
 class Context extends FakeMascotAudioContext {constructor(){super();this.deferResume=deferResume;contexts.push(this)}}
 Object.defineProperty(globalThis,'AudioContext',{configurable:true,writable:true,value:Context})
 try{await run(contexts)}finally{if(previous)Object.defineProperty(globalThis,'AudioContext',previous);else delete(globalThis as any).AudioContext}
}
const settleAudio=async()=>{for(let i=0;i<5;i++)await Promise.resolve()}
test('palm contact and seven original pia sources share exact scheduling, including muted visuals',async()=>{
 await fakeMascotAudio(async contexts=>{
  let muted=false;const audio=new MascotAudio(()=>({muted,volume:.45}),()=>{});await audio.unlock();const context=contexts[0];context.currentTime=2
  const delays=Array.from({length:7},()=>audio.play(80));assert.equal(context.startTimes.length,7)
  context.startTimes.forEach((when,i)=>{assert(Math.abs(when-(2.08+i*.015))<1e-8);assert(Math.abs(delays[i]-(80+i*15))<1e-8)})
  muted=true;assert.equal(audio.play(80),80,'muting keeps the same hand approach, without a new voice');assert.equal(context.startTimes.length,7);await audio.dispose()
 })
})
test('hidden audio cannot create, resume or play a context, and visible activation restores playback',async()=>{
 await fakeMascotAudio(async contexts=>{
  let visible=false;const audio=new MascotAudio(()=>({muted:false,volume:.45}),()=>{},()=>visible)
  await audio.unlock();audio.play();assert.equal(contexts.length,0,'hidden unlock must not start an audio device')
  visible=true;await audio.unlock();const context=contexts[0];audio.play();assert.equal(context.sourceStarts,1)
  visible=false;audio.pause();await settleAudio();const resumes=context.resumeCalls;await audio.unlock();audio.play();assert.equal(context.resumeCalls,resumes);assert.equal(context.sourceStarts,1);assert.equal(context.state,'suspended')
  // Browsers can change a context state independently of a JS resume request.
  context.transition('running');await settleAudio();assert.equal(context.state,'suspended','hidden native auto-resume is suspended again')
  visible=true;await audio.unlock();assert.equal(context.state,'running');audio.play();assert.equal(context.sourceStarts,2)
  await audio.dispose();await audio.unlock();assert.equal(context.state,'closed');assert.equal(contexts.length,1)
 })
})
test('a deferred resume finishing after pause cannot leave hidden audio running',async()=>{
 await fakeMascotAudio(async contexts=>{
  let visible=true;const audio=new MascotAudio(()=>({muted:false,volume:.45}),()=>{},()=>visible)
  const unlocking=audio.unlock(),context=contexts[0];assert.equal(context.resumeCalls,1)
  visible=false;audio.pause();context.pendingResume!();await unlocking;await settleAudio()
  assert.equal(context.state,'suspended');audio.play();assert.equal(context.sourceStarts,0)
  context.deferResume=false;visible=true;await audio.unlock();assert.equal(context.state,'running');await audio.dispose()
 },true)
})
test('foreground waits for an earlier pending suspend before resuming the same context',async()=>{
 await fakeMascotAudio(async contexts=>{
  let visible=true;const audio=new MascotAudio(()=>({muted:false,volume:.45}),()=>{},()=>visible)
  await audio.unlock();const context=contexts[0];context.deferSuspend=true;visible=false;audio.pause()
  visible=true;const unlocking=audio.unlock();context.pendingSuspend!();await unlocking
  assert.equal(context.state,'running','an earlier hide operation cannot suspend a newly restored stage')
  context.deferSuspend=false;await audio.dispose()
 })
})
test('disposing while resume is pending never restores an audio context or voice',async()=>{
 await fakeMascotAudio(async contexts=>{
  const audio=new MascotAudio(()=>({muted:false,volume:.45}),()=>{},()=>true)
  const unlocking=audio.unlock(),context=contexts[0];await audio.dispose();context.pendingResume!();await unlocking;await audio.unlock();audio.play()
  assert.equal(context.state,'closed');assert.equal(context.resumeCalls,1);assert.equal(context.sourceStarts,0);assert.equal(contexts.length,1)
 },true)
})
test('seven Minecraft textures are independent 64×64 RGBA skin atlases with opaque base faces',async()=>{
 const hashes=new Set<string>()
 for(const mascot of MASCOTS){
  const image=await sharp(path.join('src/renderer/src/assets/mascot-skins',mascot.id+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  assert.equal(image.info.width,64);assert.equal(image.info.height,64)
  for(const [x,y] of [[8,8],[20,20],[32,20],[44,20],[4,20],[20,52],[36,52]])assert.equal(image.data[(y*64+x)*4+3],255,mascot.id+' base face')
  assert.equal(image.data[(8*64+40)*4+3],0,mascot.id+' transparent outer hat');hashes.add(image.data.toString('base64'))
 }
 assert.equal(hashes.size,7)
})
test('real file-backed IPC batches are idempotent, ordered, durable, and reject changed receipts',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'kamucl-mascot-117-')),handlers=new Map<string,Function>(),event={sender:{isDestroyed:()=>false}}
 const mock={app:{getPath:()=>root},BrowserWindow:{fromWebContents:()=>({})},ipcMain:{handle:(channel:string,handler:Function)=>handlers.set(channel,handler)}}
 try{
  await fs.writeFile(path.join(root,'mascot-counts.json'),JSON.stringify({counts:{q3:4},order:['q3','qiqi','biyuehu','hongshu','kamu','milo','muchuanbei']}))
  const result=await build({entryPoints:['src/main/core/mascots.ts'],bundle:true,write:false,platform:'node',format:'cjs',external:['electron']})
  const runtime={exports:{} as any},require=createRequire(path.resolve('package.json'))
  new Function('require','module','exports',result.outputFiles[0].text)((id:string)=>id==='electron'?mock:require(id),runtime,runtime.exports)
  runtime.exports.registerMascotsIpc();const invoke=(channel:string,...args:unknown[])=>handlers.get(channel)!(event,...args)
  const old=await invoke('mascots:state');assert.equal(old.counts.q3,4);assert.deepEqual(old.sound,{muted:false,volume:.45})
  const batch={batchId:'same-retry-id',hits:MASCOTS.map(m=>m.id)}
  await Promise.all([invoke('mascots:batch',batch),invoke('mascots:batch',batch)])
  assert.equal((await invoke('mascots:state')).counts.q3,5)
  await assert.rejects(()=>invoke('mascots:batch',{...batch,hits:['q3']}),/已被使用/)
  await Promise.all(Array.from({length:10},(_,i)=>invoke('mascots:batch',{batchId:'ordered-'+i,hits:['milo']})))
  await invoke('mascots:sound',{muted:true,volume:.21});const saved=JSON.parse(await fs.readFile(path.join(root,'mascot-counts.json'),'utf8'));assert.equal(saved.counts.milo,11);assert.equal(saved.receipts.length,11);assert.deepEqual(saved.sound,{muted:true,volume:.21})
  await invoke('mascots:reset',true);assert.equal((await invoke('mascots:state')).counts.q3,0);assert.deepEqual((await invoke('mascots:state')).sound,{muted:true,volume:.21})
  // A delayed acknowledgement retry must also stay idempotent after reset.
  await invoke('mascots:batch',batch);assert.equal((await invoke('mascots:state')).counts.q3,0)
  assert.throws(()=>runtime.exports.validateMascotBatch({batchId:'bad',hits:['unknown']}));assert.throws(()=>runtime.exports.validateMascotBatch({batchId:'bad',hits:Array(513).fill('q3')}))
  const damaged='{broken json';await fs.writeFile(path.join(root,'mascot-counts.json'),damaged);await assert.rejects(()=>invoke('mascots:batch',{batchId:'later',hits:['q3']}),/未覆盖原记录/);assert.equal(await fs.readFile(path.join(root,'mascot-counts.json'),'utf8'),damaged)
 }finally{await fs.rm(root,{recursive:true,force:true})}
})
