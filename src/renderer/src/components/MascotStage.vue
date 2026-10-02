<script setup lang="ts">
import {computed,nextTick,onMounted,onUnmounted,ref,watch} from 'vue'
import {AmbientLight,DirectionalLight,Euler,Group,Mesh,NearestFilter,Object3D,OrthographicCamera,Quaternion,Scene,SRGBColorSpace,Texture,Vector3,WebGLRenderer} from 'three'
import {MASCOTS,MascotSweepGate,addMascotHits,mascotHull,mascotShapeContains,mascotWalkFrame,normalizeMascotSound,sortMascots,type MascotBatch,type MascotHitRect,type MascotState} from '@shared/mascots'
import {useMotion} from '../motion'
import {errText} from '../api'
import {toast} from '../store'
import {PreviewPlayer} from '../skinModel'
import {MascotAudio} from '../mascotAudio'
import {createMascotAtlas,MascotBatchRenderer} from '../mascotBatch'

const emit=defineEmits<{close:[];softwareRenderer:[software:boolean]}>(),{reduced,hidden,decorativeActive}=useMotion()
const props=defineProps<{focusOnReady?:boolean}>()
const host=ref<HTMLElement>(),strip=ref<HTMLElement>(),ready=ref(false),supported=ref(true),closing=ref(false),menu=ref(false),confirmReset=ref(false),persistError=ref('')
const state=ref<MascotState>({counts:{},order:MASCOTS.map(m=>m.id),sound:normalizeMascotSound()})
const sound=computed(()=>normalizeMascotSound(state.value.sound))
const skinUrls=import.meta.glob('../assets/mascot-skins/*.png',{eager:true,import:'default'}) as Record<string,string>
const gate=new MascotSweepGate(),players=new Map<string,PreviewPlayer>(),textures:Texture[]=[],lastHits=new Map<string,number>(),positions=new Map<string,number>()
type Part={name:string;mesh:Mesh;corners:Vector3[]}
type Rig={waist:Group;pelvis:Object3D;parts:Part[];feet:Part[];phase:number;dom:{button:HTMLElement|null;label:HTMLElement|null;feedback:HTMLElement|null;palms:HTMLElement[];prints:HTMLElement[]}}
const rigs=new Map<string,Rig>(),walks=new Map<string,{from:number;to:number;start:number;duration:number;phase:number}>(),palms=new Map<string,Array<{start:number;contact:number}>>()
const APPROACH_MS=80,PALM_MS=150,PRINT_MS=500
let gl:WebGLRenderer|undefined,scene:Scene,camera:OrthographicCamera,resize:ResizeObserver|undefined,frame=0,lastFrame=0,closed=false,slot=20,height=60,width=400,scale=1,hiddenAt=0
let batchRenderer:MascotBatchRenderer|undefined
const parentRotation=new Quaternion(),faceRotation=new Quaternion(),faceEuler=new Euler(),scratch=new Vector3()
let rectangles:MascotHitRect[]=[],displayOrder=MASCOTS.map(m=>m.id) as string[]
let sortTimer:ReturnType<typeof setTimeout>|undefined,saveTimer:ReturnType<typeof setTimeout>|undefined,retryTimer:ReturnType<typeof setTimeout>|undefined,retryDelay=800
let hits:string[]=[],batch:MascotBatch|undefined,flight:Promise<void>|undefined,soundRevision=0,savedSoundRevision=0,pendingReported=false
const audio=new MascotAudio(()=>sound.value,(played,voices)=>{if(host.value){host.value.dataset.soundsPlayed=String(played);host.value.dataset.activeSounds=String(voices)}},()=>!hidden.value)
const unsaved=()=>!!batch||!!hits.length||savedSoundRevision!==soundRevision
function reportPending(){const pending=unsaved();if(pending!==pendingReported){pendingReported=pending;window.kamucl.send('window:mascotPending',pending)}}
async function save():Promise<void>{
 if(flight)return flight
 flight=(async()=>{
  while(unsaved()){
   if(batch||hits.length){
    batch??={batchId:crypto.randomUUID(),hits:hits.splice(0,512),tieOrder:[...displayOrder]}
    await window.kamucl.invoke('mascots:batch',batch);batch=undefined
   }else{
    const revision=soundRevision,prefs={...sound.value}
    await window.kamucl.invoke('mascots:sound',prefs);savedSoundRevision=revision
   }
  }
  persistError.value='';retryDelay=800
 })().catch(error=>{persistError.value=errText(error);throw error}).finally(()=>{
  flight=undefined;reportPending()
  if(unsaved()&&!closed){clearTimeout(retryTimer);retryTimer=setTimeout(()=>void save().catch(()=>{}),retryDelay);retryDelay=Math.min(8000,retryDelay*2)}
 })
 return flight
}
function queueSave(){reportPending();if(!saveTimer)saveTimer=setTimeout(()=>{saveTimer=undefined;void save().catch(()=>{})},120)}
async function flush(){clearTimeout(saveTimer);saveTimer=undefined;clearTimeout(retryTimer);await save()}
async function closeStage(){if(closing.value)return;closing.value=true;try{await flush();emit('close')}catch(error){toast('互动次数尚未保存：'+errText(error),'error')}finally{closing.value=false}}
async function closeWindow(quit=false){try{await flush();window.kamucl.send(quit?'window:mascotQuit':'window:close')}catch(error){toast('互动次数尚未保存，关闭已暂停：'+errText(error),'error')}}
const unsubscribe=window.kamucl.on('window:mascotClose',payload=>void closeWindow((payload as {quit?:boolean}|undefined)?.quit===true))
function beginSort(){
 const order=sortMascots(state.value),now=hidden.value&&hiddenAt?hiddenAt:performance.now();displayOrder=order
 for(const [target,id] of order.entries()){const from=positions.get(id)??target;walks.set(id,{from,to:target,start:now,duration:reduced.value?0:Math.min(1000,200+Math.abs(target-from)*140),phase:rigs.get(id)?.phase??0})}
 wake()
}
function scheduleSort(){clearTimeout(sortTimer);sortTimer=setTimeout(beginSort,250)}
function slap(id:string){
 if(!ready.value||hidden.value||closing.value||confirmReset.value)return
 state.value=addMascotHits({...state.value,order:[...displayOrder]},[id]);hits.push(id)
 const contact=performance.now()+audio.play(reduced.value?0:APPROACH_MS)
 lastHits.set(id,contact);const queue=palms.get(id)??[];queue.push({start:contact-APPROACH_MS,contact});palms.set(id,queue.slice(-24));queueSave();scheduleSort();wake()
}
function move(event:PointerEvent){
 if(event.pointerType!=='mouse'||!ready.value||hidden.value||closing.value||confirmReset.value)return
 const started=performance.now()
 const bounds=strip.value!.getBoundingClientRect(),rects=rectangles.map(r=>({...r,left:r.left+bounds.left,right:r.right+bounds.left,top:r.top+bounds.top,bottom:r.bottom+bounds.top,polygon:r.polygon?.map(p=>({x:p.x+bounds.left,y:p.y+bounds.top}))}))
 const coalesced=event.getCoalescedEvents?.()||[],samples=coalesced.length?coalesced:[event]
 for(const sample of samples)for(const id of gate.move(sample.clientX,sample.clientY,rects))slap(id)
 if(samples[samples.length-1]!==event)for(const id of gate.move(event.clientX,event.clientY,rects))slap(id)
 if(displayOrder.join()!==state.value.order.join())scheduleSort()
 if(host.value){const duration=performance.now()-started;host.value.dataset.sweepMs=String(duration);host.value.dataset.maxSweepMs=String(Math.max(Number(host.value.dataset.maxSweepMs)||0,duration))}
}
function leave(event:PointerEvent){move(event);gate.reset()}
function clickPerson(event:MouseEvent,id:string){
 if(event.detail===0){slap(id);return}
 const bounds=strip.value!.getBoundingClientRect();if(rectangles.some(r=>r.id===id&&mascotShapeContains(r,event.clientX-bounds.left,event.clientY-bounds.top)))slap(id)
}
function soundChanged(value:Partial<{muted:boolean;volume:number}>){state.value.sound=normalizeMascotSound({...sound.value,...value});soundRevision++;audio.update();void audio.unlock();queueSave()}
async function resetCounts(){
 try{await flush();state.value=await window.kamucl.invoke('mascots:reset',true) as MascotState;confirmReset.value=false;menu.value=false;gate.reset();beginSort()}
 catch(error){toast(errText(error),'error')}
}
function fit(){
 if(!gl||!strip.value)return
 width=Math.max(1,strip.value.clientWidth);height=Math.max(1,strip.value.clientHeight-12)
 gl.setSize(width,height);const worldWidth=34*width/height
 camera.left=-worldWidth/2;camera.right=worldWidth/2;camera.top=34;camera.bottom=0;camera.updateProjectionMatrix();camera.updateMatrixWorld(true)
 slot=worldWidth/7;scale=Math.min(1,slot/20);gate.reset();wake()
}
function wake(){if(!closed&&!hidden.value&&gl&&!frame)frame=requestAnimationFrame(render)}
function render(now:number){
 frame=0;if(closed||hidden.value||!gl)return
 const renderStarted=performance.now()
 const reacting=[...palms.values()].some(queue=>queue.some(palm=>now-palm.contact<PRINT_MS)),walking=!reduced.value&&[...walks.values()].some(walk=>now-walk.start<walk.duration)
 if(decorativeActive.value&&!reacting&&!walking&&now-lastFrame<32){frame=requestAnimationFrame(render);return}
 lastFrame=now
 const worldWidth=slot*7,rects:MascotHitRect[]=[],modelBounds:Array<{id:string;top:number;bottom:number;left:number;right:number}>=[],poses:unknown[]=[]
 const project=(p:Vector3)=>{p.project(camera);return{x:(p.x+1)*width/2,y:(1-p.y)*height/2,z:p.z}}
 for(const [id,player] of players){
  const rig=rigs.get(id)!,target=displayOrder.indexOf(id),walk=walks.get(id),movement=walk?mascotWalkFrame(walk.from,walk.to,now-walk.start,reduced.value?0:walk.duration):{position:target,progress:1,travelled:0,direction:0,walking:false}
  const next=movement.position;positions.set(id,next);player.position.set(-worldWidth/2+slot*(next+.5),0,movement.walking?(movement.direction<0?2.5:-2.5):0);player.scale.setScalar(scale)
  const queue=(palms.get(id)??[]).filter(palm=>now-palm.contact<PRINT_MS);palms.set(id,queue)
  const landed=queue.filter(palm=>palm.contact<=now),age=(now-(landed.at(-1)?.contact??-1000))/210,pop=!reduced.value&&age>=0&&age<1?Math.sin(age*Math.PI)*(1-age):0
  const walkWeight=movement.walking&&!reduced.value?Math.min(1,movement.progress*8,(1-movement.progress)*8):0
  const restYaw=2.36,walkYaw=movement.direction<0?-Math.PI/2:Math.PI/2
  player.rotation.y=restYaw+Math.atan2(Math.sin(walkYaw-restYaw),Math.cos(walkYaw-restYaw))*walkWeight;player.skin.rotation.set(0,0,0);player.skin.scale.set(1,1,1)
  rig.waist.rotation.x=.44*(1-walkWeight)+.12*walkWeight+pop*.16;rig.waist.scale.y=1-pop*.06
  const phase=(walk?.phase??0)+movement.travelled*slot/7.5,step=Math.sin(phase)*.35*walkWeight;rig.phase=phase
  player.skin.leftLeg.rotation.x=step;player.skin.rightLeg.rotation.x=-step
  player.skin.leftArm.rotation.set(-.15-step*.7+pop*.2,0,.07);player.skin.rightArm.rotation.set(-.15+step*.7+pop*.2,0,-.07)
  player.updateMatrixWorld(true)
  // The neck counters waist and walking rotation, so the actual face stays visible.
  rig.waist.getWorldQuaternion(parentRotation);faceRotation.setFromEuler(faceEuler.set(.025,.32,decorativeActive.value&&!reduced.value?Math.sin(now*.0016+MASCOTS.findIndex(m=>m.id===id))*.015:0))
  player.skin.head.quaternion.copy(parentRotation).invert().multiply(faceRotation)
  let footY=Infinity;for(const part of rig.feet)for(const corner of part.corners)footY=Math.min(footY,scratch.copy(corner).applyMatrix4(part.mesh.matrixWorld).y)
  player.position.y+=1.6-footY;player.updateMatrixWorld(true)
  const personShapes=rig.parts.map(part=>{
   const points=part.corners.map(c=>project(scratch.copy(c).applyMatrix4(part.mesh.matrixWorld))),polygon=mascotHull(points)
   return{id,part:part.name,left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y)),depth:points.reduce((sum,p)=>sum+p.z,0)/points.length,polygon}
  });rects.push(...personShapes)
  const r={id,left:Math.min(...personShapes.map(r=>r.left)),right:Math.max(...personShapes.map(r=>r.right)),top:Math.min(...personShapes.map(r=>r.top)),bottom:Math.max(...personShapes.map(r=>r.bottom))};modelBounds.push(r)
  const butt=project(rig.pelvis.getWorldPosition(scratch))
  const {button,label,feedback}=rig.dom
  if(button){button.style.left=r.left+'px';button.style.top=r.top+'px';button.style.width=(r.right-r.left)+'px';button.style.height=(r.bottom-r.top)+'px';button.dataset.lastHit=String(lastHits.get(id)??0);button.style.zIndex=String(10+Math.round(player.position.z))}
  if(label){label.style.left=(player.position.x+worldWidth/2)/worldWidth*width+'px';label.style.width=width/7+'px';label.style.opacity=movement.walking?'0':'1'}
  if(feedback){feedback.style.left=butt.x+'px';feedback.style.top=butt.y+'px';feedback.dataset.target='pelvis';feedback.dataset.contacts=JSON.stringify(queue.map(palm=>palm.contact))
   const active=queue.filter(palm=>now>=palm.start&&now-palm.start<PALM_MS).slice(0,4),prints=landed.slice(-4)
   rig.dom.palms.forEach((element,index)=>{const timing=active[index],palmAge=timing?now-timing.start:Infinity,approach=Math.min(1,palmAge/APPROACH_MS),retreat=Math.max(0,(palmAge-APPROACH_MS)/(PALM_MS-APPROACH_MS));element.style.opacity=timing&&!reduced.value?String(1-retreat):'0';element.style.transform=timing?`translate(${(1-approach)*11+retreat*5}px,${-(1-approach)*10-retreat*4}px) rotate(${(1-approach)*-30+retreat*15}deg)`:'none';element.dataset.contact=String(timing?.contact??0)})
   rig.dom.prints.forEach((element,index)=>{const timing=prints[index],printAge=timing?now-timing.contact:Infinity;element.style.opacity=timing?String(reduced.value?.6:.72*(1-printAge/PRINT_MS)):'0';element.style.transform=`translate(${index%2}px,${Math.floor(index/2)}px)`;element.dataset.contact=String(timing?.contact??0)})
  }
  let actualFootY=Infinity;for(const part of rig.feet)for(const corner of part.corners)actualFootY=Math.min(actualFootY,scratch.copy(corner).applyMatrix4(part.mesh.matrixWorld).y)
  const headForward=scratch.set(0,0,1).transformDirection(player.skin.head.matrixWorld).toArray(),bodyForward=scratch.set(0,0,1).transformDirection(player.skin.body.matrixWorld).toArray()
  poses.push({id,walking:movement.walking,position:next,target,phase,waistPitch:rig.waist.rotation.x,bodyYaw:player.rotation.y,headForward,bodyForward,footY:actualFootY,butt:{x:butt.x,y:butt.y},contacts:queue.map(palm=>palm.contact)})
 }
 rectangles=rects;batchRenderer?.update();gl.render(scene,camera)
 if(host.value){host.value.dataset.modelBounds=JSON.stringify({height,width,models:modelBounds});host.value.dataset.silhouettes=JSON.stringify(rects);host.value.dataset.poses=JSON.stringify(poses);host.value.dataset.renderMs=String(performance.now()-renderStarted);host.value.dataset.renderDrawCalls=String(gl.info.render.calls);host.value.dataset.renderTriangles=String(gl.info.render.triangles)}
 if(decorativeActive.value||reacting||walking)frame=requestAnimationFrame(render)
}
async function buildScene(){
 try{
  gl=new WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});gl.setPixelRatio(Math.min(devicePixelRatio||1,2));gl.setClearColor(0,0);strip.value!.prepend(gl.domElement)
  // Software GL shares CPU time with backdrop rasterization. Preserve theme
  // colors, while temporarily yielding decorative frost to this interaction.
  try{const context=gl.getContext(),debug=context.getExtension('WEBGL_debug_renderer_info'),renderer=String(context.getParameter(debug?.UNMASKED_RENDERER_WEBGL??context.RENDERER));emit('softwareRenderer',/swiftshader|llvmpipe|lavapipe|softpipe|software/i.test(renderer))}catch{emit('softwareRenderer',false)}
  scene=new Scene();camera=new OrthographicCamera(-100,100,34,0,.1,300);camera.position.set(0,0,100);camera.lookAt(0,0,0)
  scene.add(new AmbientLight(0xffffff,2.1));const light=new DirectionalLight(0xffffff,1.2);light.position.set(-40,80,70);scene.add(light)
  await Promise.all(MASCOTS.map(async mascot=>{
   const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=skinUrls[`../assets/mascot-skins/${mascot.id}.png`]})
   if(closed)return
   const skin=new Texture(image);skin.colorSpace=SRGBColorSpace;skin.magFilter=skin.minFilter=NearestFilter;skin.generateMipmaps=false;skin.needsUpdate=true;textures.push(skin)
   const player=new PreviewPlayer();player.skin.map=skin;player.skin.setOuterLayerVisible(false);player.skin.position.y=16.8
   player.skin.head.scale.setScalar(1.42);player.skin.body.scale.y=.72;player.skin.body.position.y=-4.3
   for(const leg of [player.skin.leftLeg,player.skin.rightLeg]){leg.scale.y=.68;leg.position.y=-8.6}
   for(const arm of [player.skin.leftArm,player.skin.rightArm]){arm.scale.y=.72;arm.position.y=-1.4}
   const waist=new Group();waist.position.y=-8.6;player.skin.add(waist);player.updateMatrixWorld(true)
   for(const part of [player.skin.head,player.skin.body,player.skin.leftArm,player.skin.rightArm])waist.attach(part)
   const pelvis=new Object3D();pelvis.position.set(0,-7.9,-2.3);player.skin.add(pelvis)
   const parts:Part[]=[]
   for(const [name,part] of [['head',player.skin.head],['body',player.skin.body],['leftArm',player.skin.leftArm],['rightArm',player.skin.rightArm],['leftLeg',player.skin.leftLeg],['rightLeg',player.skin.rightLeg]] as const){part.innerLayer.traverse(object=>{if(object instanceof Mesh){object.geometry.computeBoundingBox();const b=object.geometry.boundingBox!;const corners:Vector3[]=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])corners.push(new Vector3(x,y,z));parts.push({name,mesh:object,corners})}})}
   const feedback=strip.value!.querySelector<HTMLElement>(`[data-feedback="${mascot.id}"]`)
   rigs.set(mascot.id,{waist,pelvis,parts,feet:parts.filter(p=>p.name.endsWith('Leg')),phase:0,dom:{button:strip.value!.querySelector<HTMLElement>(`[data-hit="${mascot.id}"]`),label:strip.value!.querySelector<HTMLElement>(`[data-label="${mascot.id}"]`),feedback,palms:Array.from(feedback?.querySelectorAll<HTMLElement>('.pixel-palm')??[]),prints:Array.from(feedback?.querySelectorAll<HTMLElement>('.palm-print')??[])}})
   // Rigs drive poses and visible-part hit geometry on the CPU; only their batch is rendered.
   players.set(mascot.id,player)
  }))
  if(closed)return
  const atlas=createMascotAtlas(MASCOTS.map(m=>players.get(m.id)!.skin.map!.image as HTMLImageElement));textures.push(atlas)
  batchRenderer=new MascotBatchRenderer(MASCOTS.map(m=>rigs.get(m.id)!.parts.map(part=>part.mesh)),atlas);scene.add(batchRenderer.mesh)
  resize=new ResizeObserver(fit);resize.observe(strip.value!);fit();ready.value=true;wake()
 }catch{supported.value=false;ready.value=true;gl?.dispose();gl=undefined}
}
watch(hidden,value=>{if(value){hiddenAt=performance.now();cancelAnimationFrame(frame);frame=0;gate.reset();palms.clear();lastHits.clear();strip.value?.querySelectorAll<HTMLElement>('.mascot-feedback svg').forEach(element=>element.style.opacity='0');audio.pause();void flush().catch(()=>{})}else{const paused=hiddenAt?performance.now()-hiddenAt:0;for(const walk of walks.values())walk.start+=paused;hiddenAt=0;void audio.unlock();wake()}},{flush:'sync'})
watch(decorativeActive,wake)
watch(reduced,value=>{if(value)for(const walk of walks.values()){walk.duration=0;walk.start=performance.now()}wake()},{flush:'sync'})
onMounted(async()=>{
 try{state.value=await window.kamucl.invoke('mascots:state') as MascotState;displayOrder=[...state.value.order];for(const [index,id] of displayOrder.entries())positions.set(id,index);await audio.unlock();await buildScene();if(props.focusOnReady)await nextTick(()=>strip.value?.querySelector<HTMLButtonElement>(`[data-hit="${displayOrder[0]}"]`)?.focus())}
 catch(error){persistError.value=errText(error);toast(errText(error),'error')}
})
onUnmounted(()=>{closed=true;unsubscribe();clearTimeout(sortTimer);clearTimeout(saveTimer);clearTimeout(retryTimer);cancelAnimationFrame(frame);resize?.disconnect();gate.reset();palms.clear();walks.clear();batchRenderer?.dispose();batchRenderer=undefined;rigs.clear();for(const player of players.values())player.dispose();for(const texture of textures)texture.dispose();players.clear();gl?.dispose();gl?.forceContextLoss();gl?.domElement.remove();void audio.dispose()})
defineExpose({flush,closeStage})
function keyDown(event:KeyboardEvent){void audio.unlock();if(event.repeat&&(event.key===' '||event.key==='Enter'))event.preventDefault()}
</script>

<template>
 <section ref="host" class="mascot-stage" :class="{reduced,hidden}" aria-label="七人像素彩蛋" data-ui="mascot:header" @keydown.esc.stop.prevent="menu?menu=false:closeStage()">
  <div ref="strip" class="figure-strip" @pointermove="move" @pointerleave="leave" @pointercancel="gate.reset()">
   <template v-for="mascot in MASCOTS" :key="mascot.id">
    <button class="mascot-hit" :data-hit="mascot.id" :aria-label="'拍一下 '+mascot.name+'，累计 '+(state.counts[mascot.id]||0)+' 次'" :title="mascot.name+' · '+(state.counts[mascot.id]||0)+' 次'" :disabled="!ready||closing" @click="clickPerson($event,mascot.id)" @pointerdown="audio.unlock()" @keydown="keyDown" @focus="wake" @blur="wake"></button>
    <span class="mascot-feedback" :data-feedback="mascot.id" aria-hidden="true"><svg v-for="layer in 4" :key="'print'+layer" class="palm-print" viewBox="0 0 16 16"><path d="M3 6V2h2v4h1V0h2v6h1V1h2v5h1V3h2v7h1v3h-2v2H6v-2H4v-2H1V7h2Z"/></svg><svg v-for="layer in 4" :key="'palm'+layer" class="pixel-palm" viewBox="0 0 16 16"><path fill="#71452f" d="M2 6V1h4V0h3v1h3v2h3v7h1v4h-2v2H5v-2H3v-2H0V6Z"/><path fill="#f3c699" d="M3 7V2h2v5h1V1h2v6h1V2h2v5h1V4h2v7h1v2h-2v2H6v-2H4v-2H1V7Z"/><path fill="#d9956a" d="M6 10h6v1H6Zm1 3h5v1H7Z"/></svg></span>
    <span class="mascot-label" :data-label="mascot.id"><span>{{mascot.name}}</span> <b>{{state.counts[mascot.id]||0}}</b></span>
   </template>
   <span v-if="!supported" class="fallback-note">像素预览不可用</span>
  </div>
  <div class="stage-tools">
   <button class="tool" :aria-label="sound.muted?'开启拍打音效':'静音拍打音效'" :aria-pressed="sound.muted" :title="sound.muted?'开启音效':'静音音效'" @click="soundChanged({muted:!sound.muted})">{{sound.muted?'♪̸':'♪'}}</button>
   <button class="tool close-tool" aria-label="关闭七人互动" title="关闭互动" :disabled="closing" @click="closeStage()">×</button>
   <button class="tool menu-tool" :aria-expanded="menu" aria-label="互动设置" title="音量与计数" @click="menu=!menu">⋯</button>
  </div>
  <div v-if="menu" class="sound-panel" @keydown.esc.stop="menu=false"><label>音量 <input type="range" min="0" max="100" :value="Math.round(sound.volume*100)" aria-label="拍打音效音量" @input="soundChanged({volume:Number(($event.target as HTMLInputElement).value)/100})"/><b>{{Math.round(sound.volume*100)}}%</b></label><template v-if="confirmReset"><span>清空七人累计次数？</span><div><button class="btn btn-sm btn-ghost" @click="confirmReset=false">取消</button><button class="btn btn-sm btn-ghost" @click="resetCounts()">确认清空</button></div></template><button v-else class="btn btn-sm btn-ghost" @click="confirmReset=true">重置累计次数</button></div>
  <span v-if="persistError" class="save-error" role="status" :title="persistError">保存重试中</span>
 </section>
</template>

<style scoped>
.figure-strip{contain:layout paint;isolation:isolate}
.mascot-stage{position:relative;display:flex;align-items:stretch;width:100%;height:100%;min-width:0;-webkit-app-region:no-drag;animation:stage-in .25s ease-out;container-type:inline-size}.figure-strip{position:relative;flex:1;min-width:0;height:100%;overflow:hidden;touch-action:none}.figure-strip :deep(canvas){position:absolute;left:0;top:0;display:block;pointer-events:none;image-rendering:pixelated}.mascot-hit{position:absolute;padding:0;border:0;border-radius:4px;background:transparent;cursor:pointer;z-index:2;touch-action:none}.mascot-hit:focus-visible{outline:2px solid var(--accent);outline-offset:2px;background:color-mix(in srgb,var(--accent) 12%,transparent)}.mascot-label{position:absolute;bottom:2px;transform:translateX(-50%);text-align:center;font-size:9px;line-height:10px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}.mascot-label b{color:var(--accent);font-variant-numeric:tabular-nums;font-weight:600}.slap-burst{position:absolute;inset:-7px -3px;display:grid;place-items:center;font-size:12px;font-style:normal;font-weight:700;color:var(--accent);text-shadow:0 1px var(--bg);pointer-events:none;animation:slap-flash .22s ease-out both}.stage-tools{display:grid;grid-template-columns:24px;grid-template-rows:24px 24px 20px;align-content:center;padding-left:5px;flex-shrink:0}.tool{border:0;background:transparent;color:var(--text-dim);font-size:17px;line-height:1;border-radius:5px;cursor:pointer;padding:0;min-width:0}.tool:hover,.tool:focus-visible{background:var(--card-2);color:var(--accent)}.menu-tool{font-size:15px}.sound-panel{position:absolute;right:0;top:calc(100% + 6px);z-index:9100;min-width:210px;padding:12px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--card-solid,var(--bg-2));box-shadow:var(--shadow-lg);display:grid;gap:10px;font-size:11px}.sound-panel label{display:flex;align-items:center;gap:7px}.sound-panel input{width:100px;accent-color:var(--accent)}.sound-panel b{min-width:30px}.sound-panel>div{display:flex;justify-content:flex-end;gap:4px}.save-error{position:absolute;left:0;bottom:0;font-size:9px;color:var(--accent);background:var(--bg)}.fallback-note{position:absolute;inset:0;display:grid;place-items:center;font-size:10px;color:var(--text-dim)}.hidden *{animation-play-state:paused!important}.reduced{animation:none}.reduced .slap-burst{animation:none;opacity:0}@container(max-width:270px){.mascot-label>span{display:none}.mascot-label{font-size:8px}.stage-tools{padding-left:2px;grid-template-columns:20px}}@keyframes stage-in{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}@keyframes slap-flash{0%{opacity:1;transform:scale(.8)}35%{transform:translateY(-2px) scale(1.15)}100%{opacity:0;transform:translateY(-7px) scale(.9)}}
.mascot-feedback{position:absolute;width:15px;height:15px;margin:-7.5px 0 0 -7.5px;pointer-events:none;z-index:30}.mascot-feedback svg{position:absolute;inset:0;width:100%;height:100%;shape-rendering:crispEdges;opacity:0}.pixel-palm{transform-origin:70% 90%}.palm-print{fill:#cf674e;filter:drop-shadow(0 0 1px #46221e)}
.mascot-label{transition:opacity .1s ease-out}.reduced .mascot-label{transition:none}
</style>
