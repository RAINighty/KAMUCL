<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import SkinViewer3D from './SkinViewer3D.vue'
import { loadImage, migrateLegacySkin } from '../skin-render'
import { makeBaseOpaque, paintSkinPixel, type SkinFace } from '@shared/skinPixels'
import { store, toast } from '../store'
import { errText } from '../api'
import { refreshSkinAfter } from '../skinRevision'
const props = defineProps<{ current?: string; variant?: 'classic' | 'slim' }>()
const emit = defineEmits<{ close: []; uploaded: [] }>()
const canvas = shallowRef(document.createElement('canvas'))
canvas.value.width = canvas.value.height = 64
const ctx = canvas.value.getContext('2d', { willReadFrequently: true })!
const blank = ctx.createImageData(64,64); makeBaseOpaque(blank.data);for(let i=0;i<blank.data.length;i+=4)if(blank.data[i+3]===255)blank.data[i]=blank.data[i+1]=blank.data[i+2]=220;ctx.putImageData(blank,0,0)
const viewer = ref<InstanceType<typeof SkinViewer3D>>()
const variant = ref(props.variant || 'classic'), mode = ref<'draw' | 'rotate'>('draw'), layer = ref<'inner'|'outer'>('inner')
const tool = ref('brush'), color = ref('#d88c58'), revision = ref(0), dirty = ref(false), busy = ref(false), askClose = ref(false), uploadConfirm = ref(false)
const hiddenParts = ref<string[]>([]), undo = ref<Uint8ClampedArray[]>([]), redo = ref<Uint8ClampedArray[]>([])
const palette = ['#ffffff','#292b32','#deb99a','#e94657','#eeaa46','#71bdb9','#56a6db','#8869ba','#7aad65','#7c6354']
const parts = [{key:'head',name:'头部'},{key:'body',name:'身体'},{key:'leftArm',name:'左臂'},{key:'rightArm',name:'右臂'},{key:'leftLeg',name:'左腿'},{key:'rightLeg',name:'右腿'}]
const uploadState = computed(() => store.selectedAccount?.type === 'microsoft' ? `上传至 ${store.selectedAccount.username}` : '上传需要微软正版账号；可编辑与保存 PNG')
let snapshot: Uint8ClampedArray | undefined, last: {x:number;y:number;key:string} | undefined, destination: typeof store.currentView | undefined, closingWindow=false,closingQuit=false
const pixels = () => ctx.getImageData(0,0,64,64)
function changed() { revision.value++; dirty.value = true }
function commit() {
  if (snapshot && snapshot.some((v,i) => v !== pixels().data[i])) { undo.value.push(snapshot); if(undo.value.length>80) undo.value.shift(); redo.value=[]; changed() }
  snapshot=undefined; last=undefined
}
function stroke(active: boolean) { if(active) { snapshot = pixels().data; last=undefined } else commit() }
function paint(x:number,y:number,face:SkinFace) {
  const image = pixels(), i=(y*64+x)*4
  if(tool.value==='pick') { color.value='#'+Array.from(image.data.slice(i,i+3)).map(v=>v.toString(16).padStart(2,'0')).join(''); return }
  const before=new Uint8ClampedArray(image.data)
  const rgb = [1,3,5].map(p=>parseInt(color.value.slice(p,p+2),16))
  const value = tool.value==='erase' ? (layer.value==='outer'?[0,0,0,0]:[255,255,255,255]) : [...rgb,255]
  const key=JSON.stringify(face)
  if(tool.value==='fill') paintSkinPixel(image.data,x,y,value,face,true)
  else {
    const steps=last?.key===key?Math.max(Math.abs(x-last.x),Math.abs(y-last.y)):0
    for(let s=0;s<=steps;s++) paintSkinPixel(image.data,steps?Math.round(last!.x+(x-last!.x)*s/steps):x,steps?Math.round(last!.y+(y-last!.y)*s/steps):y,value,face)
  }
  last={x,y,key}; ctx.putImageData(image,0,0); revision.value++;if(before.some((v,i)=>v!==image.data[i]))dirty.value=true
}
function history(back: boolean) {
  commit(); const from=back?undo.value:redo.value, to=back?redo.value:undo.value, next=from.pop()
  if(!next)return; to.push(pixels().data); ctx.putImageData(new ImageData(new Uint8ClampedArray(next),64,64),0,0); changed()
}
async function importImage(src:string) {
  try { const raw=await loadImage(src); if(raw.width!==64 || ![32,64].includes(raw.height)) throw new Error('请选择 64×64 或 64×32 皮肤 PNG')
    const image=migrateLegacySkin(raw); snapshot=pixels().data; ctx.clearRect(0,0,64,64); ctx.drawImage(image,0,0); const result=pixels(); makeBaseOpaque(result.data); ctx.putImageData(result,0,0); commit(); revision.value++
  } catch(e) {toast(errText(e),'error')}
}
async function choose(e:Event) { const input=e.target as HTMLInputElement,f=input.files?.[0];try{if(f){if(f.size>200000)throw Error('皮肤 PNG 文件过大，请使用标准 64×64 或 64×32 PNG');const src=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('皮肤 PNG 读取失败'));reader.readAsDataURL(f)});await importImage(src)}}catch(e){toast(errText(e),'error')}finally{input.value=''} }
function newSkin() { snapshot=pixels().data; ctx.putImageData(blank,0,0);commit();revision.value++ }
async function save() { if(busy.value)return false;busy.value=true;try{const saved=await window.kamucl.invoke('skin:editorSave',canvas.value.toDataURL('image/png'));if(saved){dirty.value=false;toast('皮肤 PNG 已保存','success')}return !!saved}catch(e){toast(errText(e),'error');return false}finally{busy.value=false} }
async function upload() { busy.value=true;try{await refreshSkinAfter(window.kamucl.invoke('skin:editorUpload',canvas.value.toDataURL('image/png'),variant.value,store.selectedAccount?.id));uploadConfirm.value=false;emit('uploaded');toast('皮肤已上传，预览与历史已更新','success')}catch(e){toast(errText(e),'error')}finally{busy.value=false} }
function close() { if(busy.value)return;commit();if(dirty.value)askClose.value=true;else finishClose() }
function finishClose() { dirty.value=false;window.kamucl.send('window:skinEditorDirty',false);emit('close');if(closingQuit)window.kamucl.send('window:skinEditorQuit');else if(closingWindow)window.kamucl.send('window:close');else if(destination){store.currentView=destination;destination=undefined} }
async function saveClose() { if(await save())finishClose() }
function keys(e:KeyboardEvent) { if(e.key==='Escape'){e.preventDefault();if(!uploadConfirm.value)close();else if(!busy.value)uploadConfirm.value=false}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();history(!e.shiftKey)} }
let restoringView=false
watch(()=>store.currentView,(next,old)=>{if(restoringView||next===old||!dirty.value)return;destination=next;restoringView=true;store.currentView=old;restoringView=false;close()},{flush:'sync'})
watch(dirty,value=>window.kamucl.send('window:skinEditorDirty',value),{flush:'sync'})
const offClose=window.kamucl.on('window:skinEditorClose',(data:any)=>{closingWindow=true;closingQuit=data?.quit===true;close()})
onBeforeUnmount(()=>{commit();offClose();window.kamucl.send('window:skinEditorDirty',false)})
</script>
<template>
  <Teleport to="body"><div class="modal-mask" @keydown="keys"><section class="modal skin-editor" role="dialog" aria-modal="true" aria-label="绘制皮肤">
    <header><div><h2>绘制皮肤</h2><p class="muted">64×64 像素 · {{dirty?'有未保存更改':'已保存'}} · 绘制模式拖动着色，旋转模式拖动视角</p></div><button class="btn btn-ghost" :disabled="busy" @click="close" aria-label="关闭绘制皮肤">×</button></header>
    <div class="editor-content"><div class="editor-model"><SkinViewer3D ref="viewer" :edit-canvas="canvas" :revision="revision" :variant="variant" :edit-mode="mode" :layer="layer" :hidden-parts="hiddenParts" paused animation="idle" @stroke="stroke" @pixel="paint" />
      <div class="tools"><button v-for="(angle,name) in {正面:0,背面:Math.PI,左侧:Math.PI/2,右侧:-Math.PI/2}" class="btn btn-ghost" @click="viewer?.view(angle)">{{name}}</button></div>
      <div class="tools"><label v-for="part in parts"><input type="checkbox" :checked="!hiddenParts.includes(part.key)" @change="hiddenParts=hiddenParts.includes(part.key)?hiddenParts.filter(v=>v!==part.key):[...hiddenParts,part.key]">{{part.name}}</label></div>
    </div><aside><div class="tools"><button class="btn" @click="newSkin">新建</button><label class="btn">导入 PNG<input class="file-input" type="file" accept="image/png" @change="choose"></label><button class="btn" :disabled="!current" @click="current&&importImage(current)">读取当前皮肤</button></div>
      <label>模型<select v-model="variant"><option value="classic">经典 Classic</option><option value="slim">纤细 Slim</option></select></label>
      <label>操作<select v-model="mode"><option value="draw">绘制像素</option><option value="rotate">旋转视角</option></select></label>
      <label>图层<select v-model="layer"><option value="inner">基础层（不透明）</option><option value="outer">外层（可透明）</option></select></label>
      <div class="tools"><button v-for="(label,key) in {brush:'画笔',erase:'橡皮',pick:'吸色',fill:'区域填色'}" class="btn" :class="{'btn-gold':tool===key}" @click="tool=key">{{label}}</button></div>
      <input v-model="color" type="color" aria-label="绘制颜色"><div class="palette"><button v-for="c in palette" :style="{background:c}" :aria-label="c" @click="color=c"></button></div>
      <div class="tools"><button class="btn" :disabled="!undo.length" @click="history(true)">撤销</button><button class="btn" :disabled="!redo.length" @click="history(false)">重做</button></div>
      <p class="muted">{{uploadState}}</p><button class="btn btn-gold" :disabled="busy" @click="save">保存 PNG…</button><button class="btn" :disabled="busy||store.selectedAccount?.type!=='microsoft'" @click="uploadConfirm=true">上传到当前账号</button>
    </aside></div>
    <div v-if="askClose" class="editor-confirm" role="alert"><p>皮肤尚未保存</p><button class="btn btn-gold" :disabled="busy" @click="saveClose">保存并退出</button><button class="btn" :disabled="busy" @click="finishClose">放弃更改</button><button class="btn" @click="askClose=false;destination=undefined;closingWindow=false;closingQuit=false">继续绘制</button></div>
    <div v-if="uploadConfirm" class="editor-confirm" role="alert"><p>将上传至 {{store.selectedAccount?.username}}，使用{{variant==='slim'?'纤细':'经典'}}模型</p><button class="btn btn-gold" :disabled="busy" @click="upload">{{busy?'正在上传…':'确认上传'}}</button><button class="btn" :disabled="busy" @click="uploadConfirm=false">取消</button></div>
  </section></div></Teleport>
</template>
<style scoped>
.skin-editor{width:min(940px,94vw);max-height:90vh;overflow:auto;padding:24px}.skin-editor header{display:flex;justify-content:space-between;gap:12px}.skin-editor h2{margin:0}.editor-content{display:grid;grid-template-columns:minmax(260px,1fr) minmax(230px,320px);gap:24px;margin-top:16px}.editor-model{--sv3d-height:430px}.tools{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.tools label{font-size:13px}aside>label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:14px 0}select{color:var(--text);background:var(--card-2);padding:8px;border-radius:8px;border:1px solid var(--border)}.file-input{display:none}.palette{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.palette button{width:24px;height:24px;border-radius:50%;border:1px solid var(--border);cursor:pointer}aside>.btn{margin:8px 8px 0 0}.editor-confirm{border-top:1px solid var(--border);margin-top:16px;padding-top:12px}.editor-confirm .btn{margin-right:8px}@media(max-width:700px){.editor-content{grid-template-columns:1fr}.editor-model{--sv3d-height:280px}}
</style>
