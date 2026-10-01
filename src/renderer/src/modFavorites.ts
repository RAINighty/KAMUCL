import { ref } from 'vue'
import type { ModFavorite } from '@shared/modFavorites'
import { errText } from './api'
import { toast } from './store'
export const favorites=ref<ModFavorite[]>([])
export async function loadFavorites(){try{favorites.value=await window.kamucl.invoke('mods:favorites') as ModFavorite[]}catch(e){toast(errText(e),'error')}}
export async function toggleProject(source:string,projectId:string,name:string){try{const key=source+':'+projectId;favorites.value=await window.kamucl.invoke('mods:favorite',{source,projectId,name},!favorites.value.some(f=>f.key===key)) as ModFavorite[]}catch(e){toast(errText(e),'error')}}
