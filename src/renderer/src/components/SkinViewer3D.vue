<script setup lang="ts">
// SPDX-License-Identifier: MIT
// KAMUCL preview lifecycle and interaction; geometry is skinview3d v3.4.2 (MIT).
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { AmbientLight, DirectionalLight, Mesh, NearestFilter, PerspectiveCamera, Raycaster, Scene, SRGBColorSpace, Texture, Vector2, WebGLRenderer } from 'three'
import type { SkinFace } from '@shared/skinPixels'
import { useMotion } from '../motion'
import { PreviewPlayer } from '../skinModel'
import { loadImage, migrateLegacySkin, detectSkinVariant } from '../skin-render'
import { beginBootTask } from '../bootTasks'
import { createFallbackSkin } from '../fallbackSkin'
const props = withDefaults(defineProps<{ src?: string; cape?: string; variant?: 'classic' | 'slim'; animation?: 'walk' | 'idle'; paused?: boolean; editCanvas?: HTMLCanvasElement; revision?: number; editMode?: 'draw' | 'rotate'; layer?: 'inner' | 'outer'; hiddenParts?: string[] }>(), { src:'', cape:'', variant:'classic', animation:'walk', paused:false })
const emit = defineEmits<{ stroke: [active: boolean]; pixel: [x: number, y: number, face: SkinFace] }>()
const raycaster = new Raycaster()
const { decorativeActive } = useMotion()
watch(decorativeActive, wake)
const container = ref<HTMLDivElement | null>(null), supported = ref(true), dragging = ref(false)
let gl: WebGLRenderer | undefined, world: Scene, camera: PerspectiveCamera, player: PreviewPlayer
let resize: ResizeObserver | undefined, frame = 0, closed = false, skinRequest = 0, capeRequest = 0
let skin: Texture | null = null, cape: Texture | null = null
let yaw = -.35, pitch = 0, zoom = 1, targetYaw = yaw, targetPitch = pitch, targetZoom = zoom
let previous = 0, seconds = 0, blend = 1, distance = 50, pointerX = 0, pointerY = 0
const clamp = (n:number,min:number,max:number) => Math.max(min,Math.min(max,n))
const finishBoot = beginBootTask()
let bootTimer: ReturnType<typeof setTimeout> | undefined
function texture(image: HTMLImageElement | HTMLCanvasElement): Texture {
  const value = new Texture(image)
  value.colorSpace = SRGBColorSpace; value.magFilter = NearestFilter; value.minFilter = NearestFilter
  value.generateMipmaps = false; value.needsUpdate = true
  return value
}
async function updateSkin(): Promise<void> {
  if (!gl) return
  const request = ++skinRequest
  let image: HTMLImageElement | HTMLCanvasElement = props.editCanvas || createFallbackSkin(), remote = !!props.editCanvas
  try { if (props.src && !props.editCanvas) { image = migrateLegacySkin(await loadImage(props.src)); remote = true } } catch { /* Usable local fallback. */ }
  if (closed || request !== skinRequest) return
  const next = texture(image), old = skin
  skin = next; player.skin.map = next; player.skin.setOuterLayerVisible(remote)
  player.skin.modelType = (props.editCanvas ? props.variant === 'slim' : remote && (props.variant === 'slim' || detectSkinVariant(image) === 'slim')) ? 'slim' : 'default'
  old?.dispose(); applyVisibility(); finishBoot(); clearTimeout(bootTimer); wake()
}
function applyVisibility() {
  if (!player || !props.editCanvas) return
  for (const name of ['head','body','leftArm','rightArm','leftLeg','rightLeg'] as const) {
    player.skin[name].visible = !props.hiddenParts?.includes(name)
    player.skin[name].outerLayer.visible = props.layer === 'outer'
  }
  wake()
}
function paintAt(event: PointerEvent) {
  if (!gl || !props.editCanvas || props.editMode !== 'draw') return
  const rect = gl.domElement.getBoundingClientRect()
  player.updateMatrixWorld(true); camera.updateMatrixWorld(true)
  raycaster.setFromCamera(new Vector2((event.clientX-rect.left)/rect.width*2-1, 1-(event.clientY-rect.top)/rect.height*2), camera)
  const objects: Mesh[] = []
  player.skin.traverseVisible(object => { if (object instanceof Mesh) { let node = object; while (node && node !== player.skin) { if (node.name === props.layer) { objects.push(object); break }; node = node.parent as Mesh } } })
  const hit = raycaster.intersectObjects(objects, false)[0]
  if (!hit?.uv || hit.faceIndex == null) return
  const mesh = hit.object as Mesh, uv = mesh.geometry.attributes.uv, group = Math.floor(hit.faceIndex / 2) * 4
  const us = [0,1,2,3].map(i => uv.getX(group+i)*64), vs = [0,1,2,3].map(i => (1-uv.getY(group+i))*64)
  const x = Math.round(Math.min(...us)), y = Math.round(Math.min(...vs)), width = Math.round(Math.max(...us))-x, height = Math.round(Math.max(...vs))-y
  emit('pixel', clamp(Math.floor(hit.uv.x*64),x,x+width-1), clamp(Math.floor((1-hit.uv.y)*64),y,y+height-1), {x,y,width,height})
}
async function updateCape(): Promise<void> {
  if (!gl) return
  const request = ++capeRequest
  let image: HTMLImageElement | undefined
  try { if (props.cape) image = await loadImage(props.cape) } catch { /* Hide a failed cape, never reuse a stale texture. */ }
  if (closed || request !== capeRequest) return
  const next = image ? texture(image) : null, old = cape
  cape = next; player.setCape(next); old?.dispose(); wake()
}
function fit(): void {
  const el = container.value
  if (!el || !gl || !el.clientWidth || !el.clientHeight) return
  gl.setSize(el.clientWidth,el.clientHeight)
  camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix()
  distance = Math.max(20, 10 / camera.aspect) / Math.tan(camera.fov * Math.PI / 360)
  wake()
}
function wake(): void {
  if (closed || frame || document.hidden || !gl) return
  previous = performance.now(); frame = requestAnimationFrame(render)
}
function render(now:number): void {
  frame = 0
  if (closed || !gl) return
  const dt = clamp((now-previous)/1000,0,.05), k = 1-Math.exp(-14*dt)
  previous = now
  if (!props.paused && decorativeActive.value) { seconds += dt; blend += ((props.animation === 'walk' ? 1 : 0)-blend)*Math.min(1,dt*6) }
  yaw += (targetYaw-yaw)*k; pitch += (targetPitch-pitch)*k; zoom += (targetZoom-zoom)*k
  player.pose(seconds,props.editCanvas ? 0 : blend,yaw)
  const d=distance/zoom
  camera.position.set(0,16+Math.sin(pitch)*d,Math.cos(pitch)*d); camera.lookAt(0,16,0)
  gl.render(world,camera)
  if ((!props.paused && decorativeActive.value) || dragging.value || Math.abs(targetYaw-yaw)+Math.abs(targetPitch-pitch)+Math.abs(targetZoom-zoom)>.0001) frame=requestAnimationFrame(render)
}
function down(event:PointerEvent):void {
  if (event.pointerType==='mouse' && event.button!==0) return
  dragging.value=true; pointerX=event.clientX; pointerY=event.clientY
  if (props.editCanvas && props.editMode === 'draw') { emit('stroke', true); paintAt(event) }
  container.value?.setPointerCapture(event.pointerId); wake()
}
function move(event:PointerEvent):void {
  if (!dragging.value) return
  if (props.editCanvas && props.editMode === 'draw') { paintAt(event); return }
  targetYaw += (event.clientX-pointerX)*.01
  targetPitch=clamp(targetPitch+(event.clientY-pointerY)*.01,-Math.PI*5/12,Math.PI*5/12)
  pointerX=event.clientX; pointerY=event.clientY; wake()
}
function up(event:PointerEvent):void {
  dragging.value=false
  if (props.editCanvas && props.editMode === 'draw') emit('stroke', false)
  if(container.value?.hasPointerCapture(event.pointerId)) container.value.releasePointerCapture(event.pointerId)
  wake()
}
function wheel(event:WheelEvent):void {
  targetZoom=clamp(targetZoom*Math.exp(-event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?100:1)*.0012),.5,3);wake()
}
function resetView():void { targetYaw=-.35;targetPitch=0;targetZoom=1;wake() }
function visibility():void { if(document.hidden){cancelAnimationFrame(frame);frame=0}else wake() }
onMounted(()=>{
  try {
    gl=new WebGLRenderer({alpha:true,antialias:true});gl.setPixelRatio(Math.min(devicePixelRatio||1,2));gl.setClearColor(0,0)
    container.value!.appendChild(gl.domElement)
    world=new Scene();camera=new PerspectiveCamera(45,1,.5,500);player=new PreviewPlayer()
    world.add(player,new AmbientLight(0xffffff,2))
    const light=new DirectionalLight(0xffffff,1);light.position.set(-15,30,50);world.add(light)
    skin=texture(createFallbackSkin());player.skin.map=skin;player.skin.setOuterLayerVisible(false)
    resize=new ResizeObserver(fit);resize.observe(container.value!);fit()
    document.addEventListener('visibilitychange',visibility)
    bootTimer=setTimeout(finishBoot,150);void updateSkin();void updateCape();wake()
  } catch { supported.value=false;finishBoot();gl?.dispose() }
})
watch([()=>props.src,()=>props.variant],()=>void updateSkin())
watch(()=>props.editCanvas,()=>void updateSkin())
watch(()=>props.revision,()=>{ if (skin) skin.needsUpdate=true; wake() })
watch([()=>props.layer,()=>props.hiddenParts],applyVisibility,{deep:true})
watch(()=>props.cape,()=>void updateCape())
watch([()=>props.paused,()=>props.animation],wake)
onUnmounted(()=>{
  closed=true;skinRequest++;capeRequest++;cancelAnimationFrame(frame);clearTimeout(bootTimer);finishBoot()
  resize?.disconnect();document.removeEventListener('visibilitychange',visibility)
  player?.dispose();skin?.dispose();cape?.dispose();gl?.dispose();gl?.forceContextLoss();gl?.domElement.remove()
})
function view(angle: number) { targetYaw=angle; targetPitch=0; yaw=angle; pitch=0; wake() }
defineExpose({resetView,view})
</script>
<template>
  <div ref="container" class="viewer3d" :class="{dragging}" @pointerdown.prevent="down" @pointermove="move" @pointerup="up" @pointercancel="up" @lostpointercapture="up" @wheel.prevent="wheel" @dblclick="resetView">
    <p v-if="!supported" class="viewer3d-fallback muted">当前环境不支持 3D 预览</p>
  </div>
</template>
<style scoped>
.viewer3d{position:relative;width:100%;height:var(--sv3d-height,340px);border-radius:var(--radius-md,10px);background:var(--sv3d-surface,var(--card-2));overflow:hidden;cursor:grab;user-select:none;touch-action:none}
.viewer3d.dragging{cursor:grabbing}.viewer3d :deep(canvas){display:block}.viewer3d-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:var(--text-sm,13px)}
</style>
