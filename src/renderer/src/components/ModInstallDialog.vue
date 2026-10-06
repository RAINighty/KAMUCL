<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { CommunityFile, InstalledVersion, ModInstallPlan } from '@shared/types'
import { prepareModInstall, commitModInstall, discardModInstall, errText } from '../api'
import { store, toast } from '../store'
import MarqueeText from './MarqueeText.vue'
import CommunityModDetails from './CommunityModDetails.vue'
import type { CommunityProjectReference } from '@shared/types'
const props = defineProps<{ target: InstalledVersion; input: { paths?: string[]; file?: CommunityFile } }>()
const emit = defineEmits<{ close: []; installed: [] }>()
const plan = ref<ModInstallPlan>(), busy = ref(true), error = ref('')
const includeDependencies = ref(true), detail = ref<CommunityProjectReference | null>(null)
const dependencies = computed(() => plan.value?.files.filter(file => file.dependency) ?? [])
const dependencyOptOut = computed(() => dependencies.value.length > 0 && !includeDependencies.value)
let disposed = false
let generation = 0
async function prepare() {
  if (busy.value && plan.value) return
  const current = ++generation
  if (plan.value) { void discardModInstall(plan.value.id); plan.value = undefined }
  busy.value = true; error.value = ''; includeDependencies.value = true
  try {
    const result = await prepareModInstall({ id: props.target.id, folder: props.target.folder! }, props.input)
    if (disposed || current !== generation) { void discardModInstall(result.id); return }
    plan.value = result
  } catch (e) { if (!disposed && current === generation) error.value = errText(e) }
  finally { if (!disposed && current === generation) busy.value = false }
}
onMounted(() => void prepare())
onUnmounted(() => { disposed = true; generation++; if (plan.value) void discardModInstall(plan.value.id) })
function dependencyDetails(file: ModInstallPlan['files'][number]) {
  if (file.source && file.projectId) detail.value = { source: file.source, projectId: file.projectId, title: file.fileName }
}
async function install() {
  if (!plan.value || busy.value || dependencyOptOut.value || plan.value.warnings.length) return
  busy.value = true; error.value = ''
  try {
    const message = await commitModInstall(plan.value.id, includeDependencies.value)
    toast(message, 'success'); store.fsRefreshTick++; emit('installed')
  } catch (e) { error.value = errText(e); plan.value = undefined }
  finally { busy.value = false }
}
</script>
<template>
  <Teleport to="body"><div class="modal-mask" style="z-index: 10020" @pointerdown.self="!busy && emit('close')">
    <section class="modal modinstall-modal" role="dialog" aria-modal="true" aria-label="安装 MOD 与前置">
      <h3 class="modal-title">安装 MOD 与前置</h3>
      <p class="muted modinstall-sub">{{ target.id }} · MC {{ target.mcVersion }} · {{ target.loader }} {{ target.loaderVersion }}<br>{{ target.folder }}</p>
      <div v-if="busy" class="modal-loading"><span class="spin"></span><span class="muted">{{ plan ? '正在下载、校验并安装…' : '正在读取 MOD 元数据与递归前置关系…' }}</span></div>
      <template v-if="plan">
        <div v-for="f in plan.files" :key="f.fileName" class="dependency-row"><span class="tag">{{ f.dependency ? '待安装前置' : '所选 MOD' }}</span><div class="dependency-name"><MarqueeText :text="f.fileName"/><MarqueeText :text="f.version"/></div><button v-if="f.dependency && f.source && f.projectId" class="btn btn-ghost btn-sm" :disabled="busy" @click="dependencyDetails(f)">查看项目</button></div>
        <p v-if="plan.missing.length" class="muted modal-note">元数据要求：{{ plan.missing.join('、') }}</p>
        <p v-for="warning in plan.warnings" :key="warning" class="modal-error">{{ warning }}</p>
        <label v-if="dependencies.length" class="dependency-choice"><input v-model="includeDependencies" type="checkbox" :disabled="busy" /><span>同时下载 {{ dependencies.length }} 个必要前置<small>与 MC {{ target.mcVersion }} / {{ target.loader }} 匹配，递归检测并校验后一起安装。</small></span></label>
        <p v-if="dependencyOptOut" class="modal-error" role="status">已取消自动下载。必要前置仍未准备好，暂不写入所选 MOD。请先自行安装前置，再点击重新检测；也可勾选后一起下载。</p>
        <p class="modal-note">已有兼容前置将复用；无法查询、没有兼容版本或出现冲突时会停止，不会当作“无需前置”继续安装。</p>
      </template>
      <p v-if="error" class="modal-error">{{ error }}</p>
      <div class="modal-actions"><button class="btn btn-ghost" :disabled="busy" @click="emit('close')">取消</button><button v-if="error || dependencyOptOut || plan?.warnings.length" class="btn btn-ghost" :disabled="busy" @click="prepare">{{ error ? '重试检测' : '重新检测' }}</button><button v-if="plan" class="btn btn-gold" :disabled="busy || !!plan.warnings.length || dependencyOptOut" @click="install">{{ dependencies.length ? '下载前置并安装' : '确认安装' }}</button></div>
    </section>
  </div></Teleport>
  <CommunityModDetails v-if="detail" :reference="detail" :allow-download="false" @close="detail = null" />
</template>
<style scoped>
.modinstall-modal {
  width: min(640px, calc(100vw - 40px));
  max-height: 85vh;
  overflow-y: auto;
}
.modal-title {
  font-size: var(--text-lg);
  font-weight: 700;
  margin: 0 0 var(--space-2);
}
.modinstall-sub {
  font-size: var(--text-xs);
  margin: 0;
  line-height: 1.6;
  word-break: break-all;
}
.modal-loading {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) 0;
}
.dependency-row { display: flex; align-items: center; gap: var(--space-3); min-height: var(--row-h); padding: var(--space-2) 0; border-bottom: 1px solid var(--border); }
.dependency-name { min-width: 0; flex: 1; }
.dependency-choice{display:flex;gap:12px;align-items:flex-start;margin:16px 0;padding:14px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--card-2);font-size:var(--text-sm)}.dependency-choice input{margin-top:2px;flex:none}.dependency-choice span{min-width:0}.dependency-choice small{display:block;color:var(--text-dim);font-size:var(--text-xs);line-height:1.6;margin-top:6px}
.modal-note { font-size: var(--text-sm); line-height: 1.6; color: var(--text-dim); }
.modal-error { color: var(--danger); white-space: pre-wrap; font-size: var(--text-sm); }
.modal-actions { display: flex; align-items: center; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-5); }
</style>
