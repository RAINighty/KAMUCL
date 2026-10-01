import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {createRequire} from 'node:module'
import {build} from 'esbuild'
import sharp from 'sharp'
import {MASCOTS,MascotSweepGate,addMascotHits,normalizeMascotSound,type MascotHitRect} from '../src/shared/mascots'
import {slapSamples} from '../src/renderer/src/mascotAudio'

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
