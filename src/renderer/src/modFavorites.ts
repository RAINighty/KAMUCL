import { ref } from 'vue'
import type { ModFavorite } from '@shared/modFavorites'
import { errText } from './api'
import { toast } from './store'
export const favorites = ref<ModFavorite[]>([])
export const favoriteBusy = ref(new Set<string>())
let writeQueue: Promise<unknown> = Promise.resolve()
let readGeneration = 0
let writeGeneration = 0
let activeRead: Promise<{ list: ModFavorite[]; writes: number }> | undefined

/** A delayed list response cannot replace a newer favorite mutation. */
export async function loadFavorites(propagateError = false): Promise<void> {
  const generation = ++readGeneration
  const read = (async () => {
    await writeQueue
    const writes = writeGeneration
    const list = await window.kamucl.invoke('mods:favorites') as ModFavorite[]
    if (generation === readGeneration && writes === writeGeneration) favorites.value = list
    return { list, writes }
  })()
  activeRead = read
  try { await read } catch (e) { if (propagateError) throw e; toast(errText(e), 'error') }
  finally { if (activeRead === read) activeRead = undefined }
}

/** Every page writes through one queue; different projects cannot overwrite each other's snapshots. */
async function mutateFavorite(key: string, request: () => Promise<ModFavorite[]>): Promise<boolean> {
  if (favoriteBusy.value.has(key)) return false
  favoriteBusy.value = new Set([...favoriteBusy.value, key])
  const initialRead = activeRead
  const job = writeQueue.then(async () => {
    const loaded = await initialRead?.catch(() => undefined)
    if (loaded && loaded.writes === writeGeneration) favorites.value = loaded.list
    writeGeneration++
    readGeneration++
    favorites.value = await request()
    return true
  })
  writeQueue = job.catch(() => {})
  try { return await job } catch (e) { toast(errText(e), 'error'); return false }
  finally { const next = new Set(favoriteBusy.value); next.delete(key); favoriteBusy.value = next }
}

export function toggleProject(source: string, projectId: string, name: string): Promise<boolean> {
  const key = source + ':' + projectId
  return mutateFavorite(key, () => window.kamucl.invoke('mods:favorite', { source, projectId, name }, !favorites.value.some(f => f.key === key)) as Promise<ModFavorite[]>)
}

export function setLocalFavorite(key: string, version: string, folder: string, name: string, enabled: boolean, link?: {source: string; projectId: string}): Promise<boolean> {
  return mutateFavorite(key, () => window.kamucl.invoke('mods:favoriteLocal', version, folder, name, enabled, link) as Promise<ModFavorite[]>)
}
