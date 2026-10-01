import type { CommunitySource } from './types'
export interface ModFavorite { key: string; name: string; source?: CommunitySource; projectId?: string; sha1?: string; added: number }
export interface FavoriteSelection { source: CommunitySource; projectId: string; fileId: string }
export function favoriteKey(value: {source?: string;projectId?: string;sha1?: string}): string {
  if ((value.source === 'modrinth' || value.source === 'curseforge') && /^[a-zA-Z0-9_-]{1,100}$/.test(value.projectId || '')) return `${value.source}:${value.projectId}`
  if (/^[a-f0-9]{40}$/i.test(value.sha1 || '')) return `sha1:${value.sha1!.toLowerCase()}`
  throw new Error('收藏缺少可信项目或文件标识')
}
