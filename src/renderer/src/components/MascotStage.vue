<script setup lang="ts">
import {computed,nextTick,onMounted,onUnmounted,ref,watch} from 'vue'
import {AmbientLight,Box3,DirectionalLight,Mesh,NearestFilter,OrthographicCamera,Scene,SRGBColorSpace,Texture,Vector3,WebGLRenderer} from 'three'
import {MASCOTS,MascotSweepGate,addMascotHits,normalizeMascotSound,sortMascots,type MascotBatch,type MascotHitRect,type MascotState} from '@shared/mascots'
import {useMotion} from '../motion'
import {errText} from '../api'
import {toast} from '../store'
import {PreviewPlayer} from '../skinModel'
import {MascotAudio} from '../mascotAudio'

const emit=defineEmits<{close:[]}>(),{reduced,hidden,decorativeActive}=useMotion()
const props=defineProps<{focusOnReady?:boolean}>()
const host=ref<HTMLElement>(),strip=ref<HTMLElement>(),ready=ref(false),supported=ref(true),closing=ref(false),menu=ref(false),confirmReset=ref(false),persistError=ref('')
const state=ref<MascotState>({counts:{},order:MASCOTS.map(m=>m.id),sound:normalizeMascotSound()})
const sound=computed(()=>normalizeMascotSound(state.value.sound)),hitVersions=ref<Record<string,number>>({})
const skinUrls=import.meta.glob('../assets/mascot-skins/*.png',{eager:true,import:'default'}) as Record<string,string>
const gate=new MascotSweepGate(),players=new Map<string,PreviewPlayer>(),textures:Texture[]=[],lastHits=new Map<string,number>(),positions=new Map<string,number>()
let gl:WebGLRenderer|undefined,scene:Scene,camera:OrthographicCamera,resize:ResizeObserver|undefined,frame=0,lastFrame=0,closed=false,slot=20,height=60,width=400,scale=1,motionUntil=0,boundsDirty=true
let rectangles:MascotHitRect[]=[],displayOrder=MASCOTS.map(m=>m.id) as string[]
let sortTimer:ReturnType<typeof setTimeout>|undefined,saveTimer:ReturnType<typeof setTimeout>|undefined,retryTimer:ReturnType<typeof setTimeout>|undefined,retryDelay=800
let hits:string[]=[],batch:MascotBatch|undefined,flight:Promise<void>|undefined,soundRevision=0,savedSoundRevision=0,pendingReported=false
const audio=new MascotAudio(()=>sound.value,(played,voices)=>{if(host.value){host.value.dataset.soundsPlayed=String(played);host.value.dataset.activeSounds=String(voices)}})
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
function scheduleSort(){clearTimeout(sortTimer);sortTimer=setTimeout(()=>{displayOrder=sortMascots(state.value);motionUntil=performance.now()+(reduced.value?0:360);wake()},250)}
function slap(id:string){
 if(!ready.value||hidden.value||closing.value||confirmReset.value)return
 state.value=addMascotHits({...state.value,order:[...displayOrder]},[id]);hits.push(id);lastHits.set(id,performance.now());hitVersions.value[id]=(hitVersions.value[id]||0)+1
 audio.play();queueSave();scheduleSort();wake()
}
function move(event:PointerEvent){
 if(event.pointerType!=='mouse'||!ready.value||hidden.value||closing.value||confirmReset.value)return
 const bounds=strip.value!.getBoundingClientRect(),rects=rectangles.map(r=>({...r,left:r.left+bounds.left,right:r.right+bounds.left,top:r.top+bounds.top,bottom:r.bottom+bounds.top}))
 const coalesced=event.getCoalescedEvents?.()||[],samples=coalesced.length?coalesced:[event]
 for(const sample of samples)for(const id of gate.move(sample.clientX,sample.clientY,rects))slap(id)
 if(samples[samples.length-1]!==event)for(const id of gate.move(event.clientX,event.clientY,rects))slap(id)
 if(displayOrder.join()!==state.value.order.join())scheduleSort()
}
function leave(event:PointerEvent){move(event);gate.reset()}
function soundChanged(value:Partial<{muted:boolean;volume:number}>){state.value.sound=normalizeMascotSound({...sound.value,...value});soundRevision++;audio.update();void audio.unlock();queueSave()}
async function resetCounts(){
 try{await flush();state.value=await window.kamucl.invoke('mascots:reset',true) as MascotState;displayOrder=[...state.value.order];confirmReset.value=false;menu.value=false;gate.reset();motionUntil=performance.now()+360;wake()}
 catch(error){toast(errText(error),'error')}
}
function fit(){
 if(!gl||!strip.value)return
 width=Math.max(1,strip.value.clientWidth);height=Math.max(1,strip.value.clientHeight-12)
 gl.setSize(width,height);const worldWidth=34*width/height
 camera.left=-worldWidth/2;camera.right=worldWidth/2;camera.top=34;camera.bottom=0;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);boundsDirty=true
 slot=worldWidth/7;scale=Math.min(1,slot/18.8);wake()
}
function wake(){if(!closed&&!hidden.value&&gl&&!frame)frame=requestAnimationFrame(render)}
function render(now:number){
 frame=0;if(closed||hidden.value||!gl)return
 const reacting=!reduced.value&&[...lastHits.values()].some(time=>now-time<220),walking=!reduced.value&&now<motionUntil
 if(decorativeActive.value&&!reacting&&!walking&&now-lastFrame<32){frame=requestAnimationFrame(render);return}
 const delta=Math.min(.05,Math.max(.001,(now-lastFrame)/1000)),ease=reduced.value?1:1-Math.exp(-18*delta);lastFrame=now
 const worldWidth=slot*7,px=height/34,rects:MascotHitRect[]=[],modelBounds:Array<{id:string;top:number;bottom:number;left:number;right:number}>=[]
 for(const [id,player] of players){
  const target=displayOrder.indexOf(id),position=positions.get(id)??target,next=Math.abs(target-position)<.001?target:position+(target-position)*ease
  positions.set(id,next);player.position.x=-worldWidth/2+slot*(next+.5);player.position.y=1.6;player.scale.setScalar(scale)
  const age=(now-(lastHits.get(id)??-1000))/200,pop=!reduced.value&&age>=0&&age<1?Math.sin(age*Math.PI)*(1-age):0
  player.rotation.y=Math.PI-.32;player.skin.rotation.x=.13;player.skin.scale.set(1+pop*.09,1-pop*.12,1)
  player.skin.head.rotation.set(.03,-.18-pop*.18,Math.sin(now*.0018+MASCOTS.findIndex(m=>m.id===id))*(decorativeActive.value ? .025 : 0))
  const step=Math.abs(next-target)>.01&&!reduced.value?Math.sin(now*.035)*.27:0
  player.skin.leftLeg.rotation.x=.12+step;player.skin.rightLeg.rotation.x=.12-step
  player.skin.leftArm.rotation.set(-.35+pop*.3,0,.06);player.skin.rightArm.rotation.set(-.35+pop*.3,0,-.06)
  player.updateMatrixWorld(true)
  const hips=new Vector3(0,8.7,-2).applyMatrix4(player.matrixWorld).project(camera)
  const x=(hips.x+1)*width/2,y=(1-hips.y)*height/2,zoneWidth=Math.max(12,Math.min(width/7*.9,12*scale*px)),zoneHeight=Math.max(10,Math.min(16,6*scale*px))
  const r={id,left:x-zoneWidth/2,top:y-zoneHeight/2,right:x+zoneWidth/2,bottom:y+zoneHeight/2};rects.push(r)
  const button=strip.value!.querySelector<HTMLElement>(`[data-hit="${id}"]`),label=strip.value!.querySelector<HTMLElement>(`[data-label="${id}"]`)
  if(button){button.style.left=r.left+'px';button.style.top=r.top+'px';button.style.width=zoneWidth+'px';button.style.height=zoneHeight+'px';button.dataset.lastHit=String(lastHits.get(id)??0)}
  if(label){label.style.left=(player.position.x+worldWidth/2)/worldWidth*width+'px';label.style.width=width/7+'px'}
  if(boundsDirty){
   const box=new Box3();player.traverseVisible(object=>{if(object instanceof Mesh){object.geometry.computeBoundingBox();if(object.geometry.boundingBox)box.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld))}})
   const points=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new Vector3(x,y,z).project(camera))
   modelBounds.push({id,top:Math.min(...points.map(p=>(1-p.y)*height/2)),bottom:Math.max(...points.map(p=>(1-p.y)*height/2)),left:Math.min(...points.map(p=>(p.x+1)*width/2)),right:Math.max(...points.map(p=>(p.x+1)*width/2))})
  }
 }
 rectangles=rects;gl.render(scene,camera)
 if(boundsDirty&&host.value){host.value.dataset.modelBounds=JSON.stringify({height,width,models:modelBounds});boundsDirty=false}
 if(decorativeActive.value||reacting||walking)frame=requestAnimationFrame(render)
}
async function buildScene(){
 try{
  gl=new WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});gl.setPixelRatio(Math.min(devicePixelRatio||1,2));gl.setClearColor(0,0);strip.value!.prepend(gl.domElement)
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
   players.set(mascot.id,player);scene.add(player)
  }))
  if(closed)return
  resize=new ResizeObserver(fit);resize.observe(strip.value!);fit();ready.value=true;wake()
 }catch{supported.value=false;ready.value=true;gl?.dispose();gl=undefined}
}
watch(hidden,value=>{if(value){cancelAnimationFrame(frame);frame=0;gate.reset();audio.pause();void flush().catch(()=>{})}else{void audio.unlock();wake()}})
watch(decorativeActive,wake)
watch(reduced,wake)
onMounted(async()=>{
 try{state.value=await window.kamucl.invoke('mascots:state') as MascotState;displayOrder=[...state.value.order];for(const [index,id] of displayOrder.entries())positions.set(id,index);await audio.unlock();await buildScene();if(props.focusOnReady)await nextTick(()=>strip.value?.querySelector<HTMLButtonElement>(`[data-hit="${displayOrder[0]}"]`)?.focus())}
 catch(error){persistError.value=errText(error);toast(errText(error),'error')}
})
onUnmounted(()=>{closed=true;unsubscribe();clearTimeout(sortTimer);clearTimeout(saveTimer);clearTimeout(retryTimer);cancelAnimationFrame(frame);resize?.disconnect();gate.reset();for(const player of players.values())player.dispose();for(const texture of textures)texture.dispose();players.clear();gl?.dispose();gl?.forceContextLoss();gl?.domElement.remove();void audio.dispose()})
defineExpose({flush,closeStage})
function keyDown(event:KeyboardEvent){void audio.unlock();if(event.repeat&&(event.key===' '||event.key==='Enter'))event.preventDefault()}
</script>

<template>
 <section ref="host" class="mascot-stage" :class="{reduced,hidden}" aria-label="七人像素彩蛋" data-ui="mascot:header" @keydown.esc.stop.prevent="menu?menu=false:closeStage()">
  <div ref="strip" class="figure-strip" @pointermove="move" @pointerleave="leave" @pointercancel="gate.reset()">
   <template v-for="mascot in MASCOTS" :key="mascot.id">
    <button class="mascot-hit" :data-hit="mascot.id" :aria-label="'拍一下 '+mascot.name+'，累计 '+(state.counts[mascot.id]||0)+' 次'" :title="mascot.name+' · '+(state.counts[mascot.id]||0)+' 次'" :disabled="!ready||closing" @click="slap(mascot.id)" @pointerdown="audio.unlock()" @keydown="keyDown"><i v-if="hitVersions[mascot.id]" :key="hitVersions[mascot.id]" class="slap-burst" aria-hidden="true">啪</i></button>
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
.mascot-stage{position:relative;display:flex;align-items:stretch;width:100%;height:100%;min-width:0;-webkit-app-region:no-drag;animation:stage-in .25s ease-out;container-type:inline-size}.figure-strip{position:relative;flex:1;min-width:0;height:100%;overflow:hidden;touch-action:none}.figure-strip :deep(canvas){position:absolute;left:0;top:0;display:block;pointer-events:none;image-rendering:pixelated}.mascot-hit{position:absolute;padding:0;border:0;border-radius:4px;background:transparent;cursor:pointer;z-index:2;touch-action:none}.mascot-hit:focus-visible{outline:2px solid var(--accent);outline-offset:2px;background:color-mix(in srgb,var(--accent) 12%,transparent)}.mascot-label{position:absolute;bottom:2px;transform:translateX(-50%);text-align:center;font-size:9px;line-height:10px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}.mascot-label b{color:var(--accent);font-variant-numeric:tabular-nums;font-weight:600}.slap-burst{position:absolute;inset:-7px -3px;display:grid;place-items:center;font-size:12px;font-style:normal;font-weight:700;color:var(--accent);text-shadow:0 1px var(--bg);pointer-events:none;animation:slap-flash .22s ease-out both}.stage-tools{display:grid;grid-template-columns:24px;grid-template-rows:24px 24px 20px;align-content:center;padding-left:5px;flex-shrink:0}.tool{border:0;background:transparent;color:var(--text-dim);font-size:17px;line-height:1;border-radius:5px;cursor:pointer;padding:0;min-width:0}.tool:hover,.tool:focus-visible{background:var(--card-2);color:var(--accent)}.menu-tool{font-size:15px}.sound-panel{position:absolute;right:0;top:calc(100% + 6px);z-index:9100;min-width:210px;padding:12px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--card-solid,var(--bg-2));box-shadow:var(--shadow-lg);display:grid;gap:10px;font-size:11px}.sound-panel label{display:flex;align-items:center;gap:7px}.sound-panel input{width:100px;accent-color:var(--accent)}.sound-panel b{min-width:30px}.sound-panel>div{display:flex;justify-content:flex-end;gap:4px}.save-error{position:absolute;left:0;bottom:0;font-size:9px;color:var(--accent);background:var(--bg)}.fallback-note{position:absolute;inset:0;display:grid;place-items:center;font-size:10px;color:var(--text-dim)}.hidden *{animation-play-state:paused!important}.reduced{animation:none}.reduced .slap-burst{animation:none;opacity:0}@container(max-width:270px){.mascot-label>span{display:none}.mascot-label{font-size:8px}.stage-tools{padding-left:2px;grid-template-columns:20px}}@keyframes stage-in{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}@keyframes slap-flash{0%{opacity:1;transform:scale(.8)}35%{transform:translateY(-2px) scale(1.15)}100%{opacity:0;transform:translateY(-7px) scale(.9)}}
</style>
