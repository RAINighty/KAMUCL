<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import SkinViewer3D from './SkinViewer3D.vue'
import SkinColorPalette from './SkinColorPalette.vue'
import { loadImage, migrateLegacySkin } from '../skin-render'
import { makeBaseOpaque, paintSkinPixel, type SkinFace } from '@shared/skinPixels'
import { parseSkinHex, rememberSkinColor, rgbToSkinHex, skinBrushRgba } from '@shared/skinColors'
import { normalizeSkinPalettePreferences } from '@shared/skinPalettePreferences'
import type { SkinEditorPaletteSettings } from '@shared/types'
import { store, toast } from '../store'
import { errText, saveSettings } from '../api'
import { refreshSkinAfter } from '../skinRevision'
import { mergeSkinCloseIntent, type SkinCloseIntent } from '../skinEditorInteraction'
const props = defineProps<{ current?: string; variant?: 'classic' | 'slim' }>()
const emit = defineEmits<{ close: []; uploaded: [] }>()
const canvas = shallowRef(document.createElement('canvas'))
canvas.value.width = canvas.value.height = 64
const ctx = canvas.value.getContext('2d', { willReadFrequently: true })!
const blank = ctx.createImageData(64,64); makeBaseOpaque(blank.data)
for(let i=0;i<blank.data.length;i+=4)if(blank.data[i+3]===255)blank.data[i]=blank.data[i+1]=blank.data[i+2]=220
ctx.putImageData(blank,0,0)
const viewer = ref<InstanceType<typeof SkinViewer3D>>(), closeButton = ref<HTMLButtonElement>(), fileInput = ref<HTMLInputElement>()
const variant = ref(props.variant || 'classic'), layer = ref<'inner'|'outer'>('inner')
const palettePreferences = ref(normalizeSkinPalettePreferences(store.settings?.skinEditorPalette))
const color = computed({ get: () => palettePreferences.value.color, set: value => { const rgb = parseSkinHex(value); if (rgb) palettePreferences.value.color = rgbToSkinHex(rgb) } })
const alpha = computed({ get: () => palettePreferences.value.alpha, set: value => { if (Number.isFinite(value)) palettePreferences.value.alpha = Math.max(0, Math.min(1, value)) } })
const tool = ref('brush'), revision = ref(0), dirty = ref(false), busy = ref(false), busyText = ref(''), finishingClose = ref(false), askClose = ref(false), uploadConfirm = ref(false)
const operationError = ref('')
const hiddenParts = ref<string[]>([]), undo = ref<Uint8ClampedArray[]>([]), redo = ref<Uint8ClampedArray[]>([])
type CloseIntent = SkinCloseIntent<typeof store.currentView>
const closeIntent = shallowRef<CloseIntent>()
const blocked = computed(() => busy.value || finishingClose.value || askClose.value || uploadConfirm.value)
const ownerId = crypto.randomUUID()
let disposed = false, paletteTimer: ReturnType<typeof setTimeout> | undefined, pendingPalette: SkinEditorPaletteSettings | undefined, paletteWrite: Promise<void> | undefined
function flushPalette(): Promise<void> {
  if (paletteWrite) return paletteWrite
  paletteWrite = (async () => {
    while (pendingPalette) {
      const next = pendingPalette; pendingPalette = undefined
      try { await saveSettings({ skinEditorPalette: next }) }
      catch (error) { toast('调色板偏好未能保存：' + errText(error), 'error') }
    }
  })().finally(() => { paletteWrite = undefined; window.kamucl.send('window:skinEditorPrefsPending', { ownerId, pending: !!pendingPalette }) })
  return paletteWrite
}
watch(palettePreferences, value => {
  pendingPalette = normalizeSkinPalettePreferences(value)
  window.kamucl.send('window:skinEditorPrefsPending', { ownerId, pending: true })
  if (store.settings) store.settings.skinEditorPalette = pendingPalette
  clearTimeout(paletteTimer); paletteTimer = setTimeout(() => void flushPalette(), 350)
}, { deep: true, flush: 'sync' })
watch(busy, pending => window.kamucl.send('window:skinEditorBusy', { ownerId, pending }), { flush: 'sync' })
const parts = [{key:'head',name:'头部'},{key:'body',name:'身体'},{key:'leftArm',name:'左臂'},{key:'rightArm',name:'右臂'},{key:'leftLeg',name:'左腿'},{key:'rightLeg',name:'右腿'}]
const views = [{name:'正面',yaw:0,pitch:0},{name:'背面',yaw:Math.PI,pitch:0},{name:'左侧',yaw:Math.PI/2,pitch:0},{name:'右侧',yaw:-Math.PI/2,pitch:0},{name:'俯视',yaw:0,pitch:Math.PI*5/12},{name:'仰视',yaw:0,pitch:-Math.PI*5/12}]
const selectedView = ref('')
const uploadState = computed(() => store.selectedAccount?.type === 'microsoft' ? `上传至 ${store.selectedAccount.username}` : '上传需要微软正版账号；可编辑与保存 PNG')
let snapshot: Uint8ClampedArray | undefined, last: {x:number;y:number;key:string} | undefined
const pixels = () => ctx.getImageData(0,0,64,64)
const canEdit = () => !disposed && !blocked.value
function changed() { revision.value++; dirty.value = true }
function commit() {
  const current=pixels().data
  if (snapshot && snapshot.some((v,i) => v !== current[i])) { undo.value.push(snapshot); if(undo.value.length>80)undo.value.shift(); redo.value=[]; changed() }
  snapshot=undefined; last=undefined
}
function endGesture() { viewer.value?.finishGesture(); commit() }
function stroke(active: boolean) { if(!active){commit();return}if(canEdit()){snapshot=pixels().data;last=undefined;selectedView.value=''} }
function paint(x:number,y:number,face:SkinFace) {
  if(!canEdit())return
  const image=pixels(), i=(y*64+x)*4
  if(tool.value==='pick'){color.value='#'+Array.from(image.data.slice(i,i+3)).map(v=>v.toString(16).padStart(2,'0')).join('');if(layer.value==='outer')alpha.value=image.data[i+3]/255;return}
  const before=new Uint8ClampedArray(image.data)
  const value=tool.value==='erase'?(layer.value==='outer'?[0,0,0,0]:[255,255,255,255]):skinBrushRgba(color.value,alpha.value,layer.value==='outer')
  if(!value)return
  const key=JSON.stringify(face)
  if(tool.value==='fill')paintSkinPixel(image.data,x,y,value,face,true)
  else{const steps=last?.key===key?Math.max(Math.abs(x-last.x),Math.abs(y-last.y)):0;for(let s=0;s<=steps;s++)paintSkinPixel(image.data,steps?Math.round(last!.x+(x-last!.x)*s/steps):x,steps?Math.round(last!.y+(y-last!.y)*s/steps):y,value,face)}
  last={x,y,key};ctx.putImageData(image,0,0);revision.value++
  const rendered=pixels().data
  if(before.some((v,index)=>v!==rendered[index])){dirty.value=true;if(tool.value!=='erase'&&palettePreferences.value.recent[0]!==color.value)palettePreferences.value.recent=rememberSkinColor(palettePreferences.value.recent,color.value)}
}
function history(back:boolean){if(!canEdit())return;endGesture();const from=back?undo.value:redo.value,to=back?redo.value:undo.value,next=from.pop();if(!next)return;to.push(pixels().data);ctx.putImageData(new ImageData(new Uint8ClampedArray(next),64,64),0,0);changed()}
async function replaceImage(src:string){const raw=await loadImage(src);if(disposed||finishingClose.value)return;if(raw.width!==64||![32,64].includes(raw.height))throw Error('请选择 64×64 或 64×32 皮肤 PNG');const image=migrateLegacySkin(raw);snapshot=pixels().data;ctx.clearRect(0,0,64,64);ctx.drawImage(image,0,0);const result=pixels();makeBaseOpaque(result.data);ctx.putImageData(result,0,0);commit();revision.value++}
function beginOperation(text:string){endGesture();operationError.value='';busyText.value=text;busy.value=true}
function finishOperation(){busy.value=false;busyText.value='';if(!disposed)processClose()}
function failOperation(error:unknown){operationError.value=errText(error);toast(operationError.value,'error')}
async function importImage(src:string){if(!canEdit())return;beginOperation('正在读取皮肤…');try{await replaceImage(src)}catch(error){failOperation(error)}finally{finishOperation()}}
async function choose(event:Event){
  const input=event.target as HTMLInputElement,file=input.files?.[0]
  if(!file||!canEdit()){input.value='';return}
  beginOperation('正在读取皮肤…')
  try{if(file.size>200000)throw Error('皮肤 PNG 文件过大，请使用标准 64×64 或 64×32 PNG');const src=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('皮肤 PNG 读取失败'));reader.readAsDataURL(file)});await replaceImage(src)}catch(error){failOperation(error)}finally{input.value='';finishOperation()}
}
function newSkin(){if(canEdit()){endGesture();operationError.value='';snapshot=pixels().data;ctx.putImageData(blank,0,0);commit();revision.value++}}
async function save(){
  if(busy.value||finishingClose.value||disposed)return false
  beginOperation('正在保存皮肤…')
  try{const saved=await window.kamucl.invoke('skin:editorSave',canvas.value.toDataURL('image/png'));if(saved){dirty.value=false;toast('皮肤 PNG 已保存','success')}return !!saved}catch(error){failOperation(error);return false}finally{finishOperation()}
}
function openUpload(){if(canEdit()){endGesture();operationError.value='';uploadConfirm.value=true}}
async function upload(){
  if(busy.value||finishingClose.value||disposed)return
  beginOperation('正在上传皮肤…')
  try{await refreshSkinAfter(window.kamucl.invoke('skin:editorUpload',canvas.value.toDataURL('image/png'),variant.value,store.selectedAccount?.id));uploadConfirm.value=false;emit('uploaded');toast('皮肤已上传，预览与历史已更新','success')}catch(error){failOperation(error)}finally{finishOperation()}
}
function requestClose(intent:CloseIntent={kind:'editor'}){if(disposed)return;closeIntent.value=mergeSkinCloseIntent(closeIntent.value,intent);if(finishingClose.value)return;endGesture();uploadConfirm.value=false;processClose()}
function processClose(){if(!closeIntent.value||busy.value||finishingClose.value||disposed)return;if(dirty.value)askClose.value=true;else void finishClose()}
function cancelClose(){if(finishingClose.value)return;askClose.value=false;closeIntent.value=undefined;void nextTick(()=>closeButton.value?.focus({preventScroll:true}))}
function cancelUpload(){if(busy.value)requestClose();else{uploadConfirm.value=false;void nextTick(()=>closeButton.value?.focus({preventScroll:true}))}}
async function finishClose(){
  if(finishingClose.value||busy.value||disposed)return
  endGesture();finishingClose.value=true;askClose.value=false;uploadConfirm.value=false;clearTimeout(paletteTimer);await flushPalette()
  const intent=closeIntent.value;closeIntent.value=undefined
  dirty.value=false;window.kamucl.send('window:skinEditorDirty',false);emit('close')
  if(intent?.kind==='quit')window.kamucl.send('window:skinEditorQuit');else if(intent?.kind==='window')window.kamucl.send('window:close');else if(intent?.kind==='navigate')store.currentView=intent.destination
}
async function saveClose(){if(await save() && closeIntent.value)await finishClose()}
function selectView(view:typeof views[number]){if(!blocked.value){endGesture();selectedView.value=view.name;viewer.value?.view(view.yaw,view.pitch)}}
function resetView(){if(!blocked.value){endGesture();selectedView.value='';viewer.value?.resetView()}}
function togglePart(key:string){if(!blocked.value){endGesture();hiddenParts.value=hiddenParts.value.includes(key)?hiddenParts.value.filter(v=>v!==key):[...hiddenParts.value,key]}}
function keys(event:KeyboardEvent){
  if(event.isComposing||event.defaultPrevented)return
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();if(askClose.value||busy.value&&closeIntent.value)cancelClose();else if(uploadConfirm.value)cancelUpload();else requestClose();return}
  const target=event.target as HTMLElement
  if(target?.closest('input,textarea,select')||target?.isContentEditable||blocked.value)return
  const key=event.key.toLowerCase()
  if((event.ctrlKey||event.metaKey)&&key==='z'){event.preventDefault();history(!event.shiftKey)}
  else if((event.ctrlKey||event.metaKey)&&key==='s'){event.preventDefault();void save()}
  else if(!event.ctrlKey&&!event.metaKey&&!event.altKey&&['b','e','i','g'].includes(key)){event.preventDefault();tool.value=({b:'brush',e:'erase',i:'pick',g:'fill'} as Record<string,string>)[key]}
}
watch([tool,color,alpha],()=>viewer.value?.finishGesture(),{flush:'sync'})
let restoringView=false
watch(()=>store.currentView,(next,old)=>{if(restoringView||next===old||!(dirty.value||busy.value||finishingClose.value))return;restoringView=true;store.currentView=old;restoringView=false;requestClose({kind:'navigate',destination:next})},{flush:'sync'})
watch(dirty,value=>window.kamucl.send('window:skinEditorDirty',value),{flush:'sync'})
const offClose=window.kamucl.on('window:skinEditorClose',(data:any)=>requestClose({kind:data?.quit===true?'quit':'window'}))
onBeforeUnmount(()=>{endGesture();disposed=true;clearTimeout(paletteTimer);void flushPalette();offClose();window.kamucl.send('window:skinEditorDirty',false);window.kamucl.send('window:skinEditorBusy',{ownerId,pending:false})})
</script>

<template>
  <Teleport to="body">
    <div class="modal-mask skin-editor-mask" @keydown="keys"><section class="modal skin-editor" role="dialog" aria-modal="true" aria-label="绘制皮肤" :inert="finishingClose || askClose || uploadConfirm">
      <header class="editor-header"><div><h2>绘制皮肤</h2><p class="muted">64×64 像素 · {{dirty?'有未保存更改':'已保存'}}</p></div><button ref="closeButton" class="icon-btn editor-close" :disabled="finishingClose" @click="requestClose()" aria-label="关闭绘制皮肤" data-modal-dismiss>×</button></header>
      <div class="editor-content" :inert="busy"><div class="editor-model">
        <p class="editor-pointer-help muted">左键绘制 · 中键 / Alt+左键旋转 · 滚轮缩放</p>
        <SkinViewer3D ref="viewer" :edit-canvas="canvas" :revision="revision" :variant="variant" edit-mode="draw" :edit-disabled="blocked" :layer="layer" :hidden-parts="hiddenParts" paused animation="idle" @stroke="stroke" @pixel="paint" @gap="last=undefined" @rotate="selectedView=''" />
        <div class="editor-controls" role="group" aria-label="快捷视角"><span class="control-label">视角</span><div class="tools view-tools"><button v-for="view in views" :key="view.name" class="btn btn-ghost" :class="{selected:selectedView===view.name}" :aria-pressed="selectedView===view.name" @click="selectView(view)">{{view.name}}</button><button class="btn btn-ghost" @click="resetView">恢复视角</button></div></div>
        <div class="editor-controls" role="group" aria-label="显示部位"><div class="control-heading"><span class="control-label">显示部位</span><button class="btn btn-ghost btn-sm" :disabled="!hiddenParts.length" @click="hiddenParts=[]">全部显示</button></div><div class="tools part-tools"><button v-for="part in parts" :key="part.key" class="btn btn-ghost" :class="{selected:!hiddenParts.includes(part.key)}" :aria-pressed="!hiddenParts.includes(part.key)" @click="togglePart(part.key)">{{part.name}}</button></div><p v-if="hiddenParts.length===parts.length" class="muted editor-empty-parts" role="status">所有部位已隐藏，点击部位或“全部显示”恢复。</p></div>
      </div><aside aria-label="绘制工具与颜色">
        <div class="tools file-tools"><button class="btn" @click="newSkin">新建</button><button class="btn" @click="fileInput?.click()">导入 PNG</button><input ref="fileInput" class="file-input" type="file" accept="image/png" @change="choose"><button class="btn" :disabled="!current" @click="current&&importImage(current)">读取当前皮肤</button></div>
        <div class="editor-options"><label>模型<select v-model="variant" aria-label="皮肤模型"><option value="classic">经典 Classic</option><option value="slim">纤细 Slim</option></select></label><label>图层<select v-model="layer" aria-label="皮肤图层"><option value="inner">基础层（不透明）</option><option value="outer">外层（可透明）</option></select></label></div>
        <div class="tools paint-tools" role="group" aria-label="绘制工具"><button v-for="(label,key) in {brush:'画笔',erase:'橡皮',pick:'吸色',fill:'区域填色'}" :key="key" class="btn" :class="{'btn-gold':tool===key}" :aria-pressed="tool===key" @click="tool=key">{{label}}</button></div>
        <SkinColorPalette v-model:color="color" v-model:alpha="alpha" :alpha-enabled="layer==='outer'" :custom="palettePreferences.custom" :recent="palettePreferences.recent" @update:custom="palettePreferences.custom=$event" />
      </aside></div>
      <footer class="editor-footer"><div class="editor-footer-history"><button class="btn" :disabled="blocked||!undo.length" @click="history(true)">撤销</button><button class="btn" :disabled="blocked||!redo.length" @click="history(false)">重做</button></div><div class="editor-footer-save"><button class="btn btn-gold" :disabled="blocked" @click="save">保存 PNG…</button><button class="btn" :disabled="blocked||store.selectedAccount?.type!=='microsoft'" @click="openUpload">上传到当前账号</button></div><p class="muted editor-operation-status" role="status">{{finishingClose?'正在保存调色板偏好…':busy?busyText+(closeIntent?' 完成后处理关闭请求。':''):uploadState}}</p><button v-if="busy&&closeIntent" class="btn btn-ghost btn-sm" @click="cancelClose">取消关闭</button><p v-if="operationError" class="editor-operation-error" role="alert">{{operationError}}</p></footer>
    </section></div>
    <div v-if="askClose" class="modal-mask skin-confirm-mask" @keydown="keys"><section class="modal skin-close-dialog editor-confirm" role="alertdialog" aria-modal="true" aria-label="保存皮肤更改" aria-describedby="skin-unsaved-description"><h2>皮肤尚未保存</h2><p id="skin-unsaved-description">保存当前皮肤后退出，或放弃本次未保存的修改。</p><div class="modal-actions"><button class="btn btn-gold" :disabled="busy" @click="saveClose">保存并退出</button><button class="btn" :disabled="busy" @click="finishClose">放弃更改</button><button class="btn" data-modal-initial-focus data-modal-dismiss @click="cancelClose">{{busy?'取消关闭':'继续绘制'}}</button></div><p v-if="busy" class="muted" role="status">{{busyText}}</p><p v-if="operationError" class="editor-operation-error" role="alert">{{operationError}}</p></section></div>
    <div v-if="uploadConfirm" class="modal-mask skin-confirm-mask" @keydown="keys"><section class="modal skin-upload-dialog editor-confirm" role="alertdialog" aria-modal="true" aria-label="确认上传皮肤"><h2>上传皮肤</h2><p>将上传至 {{store.selectedAccount?.username}}，使用{{variant==='slim'?'纤细':'经典'}}模型。</p><div class="modal-actions"><button class="btn btn-gold" :disabled="busy" @click="upload">{{busy?'正在上传…':'确认上传'}}</button><button class="btn" data-modal-initial-focus data-modal-dismiss @click="cancelUpload">{{busy?'完成后关闭编辑器':'取消'}}</button></div><p v-if="operationError" class="editor-operation-error" role="alert">{{operationError}}</p></section></div>
  </Teleport>
</template>

<style scoped>
.skin-editor{width:min(1020px,calc(100vw - 32px));height:min(820px,calc(100vh - 32px));max-height:calc(100vh - 32px);padding:0;display:flex;flex-direction:column;overflow:hidden}.editor-header{display:flex;flex-shrink:0;align-items:center;justify-content:space-between;gap:16px;padding:16px 20px;border-bottom:1px solid var(--border)}.editor-header h2{margin:0;font-size:20px}.editor-header p{margin:4px 0 0;font-size:12px}.editor-close{font-size:24px;width:36px;height:36px;flex-shrink:0}.editor-content{display:grid;grid-template-columns:minmax(260px,1fr) minmax(270px,340px);min-height:0;flex:1;overflow:hidden;gap:20px;padding:16px 20px}.editor-model{min-height:0;display:flex;flex-direction:column;overflow:hidden;padding-right:4px}.editor-model :deep(.viewer3d){flex:1 1 0;height:auto;min-height:0}.editor-pointer-help{flex-shrink:0;margin:0 0 10px;font-size:12px}.editor-content aside{min-height:0;overflow:auto;scrollbar-gutter:stable;padding:0 4px 4px 0}.tools{display:flex;flex-wrap:wrap;gap:6px}.file-tools{margin-bottom:14px}.file-tools .btn{font-size:12px;padding:6px 10px}.editor-options{display:grid;gap:10px;margin-bottom:14px}.editor-options label{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px}.editor-options select{color:var(--text);background:var(--card-2);padding:7px 9px;border-radius:8px;border:1px solid var(--border)}.paint-tools{margin-bottom:12px}.paint-tools .btn{flex:1;min-width:48px;padding:7px 8px;font-size:12px}.file-input{display:none}.editor-controls{border:1px solid var(--border);border-radius:10px;padding:10px;margin-top:10px;background:var(--card-2);flex-shrink:0}.control-label{font-size:12px;color:var(--text-dim)}.control-heading{display:flex;align-items:center;justify-content:space-between;gap:8px}.view-tools,.part-tools{margin-top:8px}.view-tools .btn,.part-tools .btn{padding:6px 9px;font-size:12px;min-height:30px}.editor-controls .btn.selected{background:var(--accent-soft);border-color:var(--accent);color:var(--text)}.editor-empty-parts{margin:8px 0 0;font-size:12px}.editor-footer{flex-shrink:0;display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:12px 20px;border-top:1px solid var(--border);background:var(--card-2)}.editor-footer-history,.editor-footer-save{display:flex;flex-wrap:wrap;gap:8px}.editor-footer-save{margin-left:auto}.editor-operation-status{flex:1 1 100%;margin:0;font-size:12px}.skin-confirm-mask{z-index:10001}.editor-confirm{width:min(460px,calc(100vw - 32px))}.editor-confirm h2{margin:0;font-size:20px}.editor-confirm p{line-height:1.7}.editor-confirm .modal-actions{gap:8px}.editor-confirm .btn{padding:8px 12px;font-size:13px}@media(max-width:700px){.editor-content{grid-template-columns:minmax(0,1fr);overflow:auto;gap:16px}.editor-content aside{overflow:visible}.editor-model{height:460px;min-height:460px;overflow:hidden}.editor-footer-save{margin-left:0}.editor-header,.editor-footer{padding:12px 16px}.editor-content{padding:12px 16px}}@media(max-height:580px){.editor-content{padding-top:10px;padding-bottom:10px}.editor-header{padding-top:10px;padding-bottom:10px}.editor-footer{padding-top:8px;padding-bottom:8px}}
.editor-operation-error{flex:1 1 100%;margin:0;max-height:72px;overflow:auto;overflow-wrap:anywhere;font-size:12px;line-height:1.6;color:var(--danger,#e77979)}
</style>
