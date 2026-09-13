import { httpFetch } from './httpClient'

export interface CfMetadataSource { base: string; headers?: Record<string, string> }
export interface ResolvedCfDownload { url: string; fileName: string; sha1: string; size: number }

/** Resolve the manifest's exact file, retaining integrity for ranges and persistent reuse. */
export async function resolveCurseForgeDownload(projectID: number, fileID: number, sources: CfMetadataSource[], signal?: AbortSignal): Promise<ResolvedCfDownload> {
  if (![projectID, fileID].every(n => Number.isSafeInteger(n) && n > 0)) throw new Error('CurseForge 文件标识无效')
  let last: unknown
  for (const source of sources) {
    signal?.throwIfAborted()
    const timeout = AbortSignal.timeout(6000)
    const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout
    try {
      const res = await httpFetch(`${source.base}/mods/${projectID}/files/${fileID}`, { signal: requestSignal, headers: source.headers })
      if (!res.ok) { await res.body?.cancel(); throw new Error(`文件信息 HTTP ${res.status}`) }
      const { data } = await res.json() as { data?: { id?: number; modId?: number; isAvailable?: boolean; fileName?: string; downloadUrl?: string | null; fileLength?: number; hashes?: { algo: number; value: string }[] } }
      if (data?.id !== fileID || data.modId !== projectID) throw new Error('文件信息与整合包清单不匹配')
      if (data.isAvailable === false || !data.downloadUrl) throw new Error('作者未提供可自动下载的文件，请在 CurseForge 文件页面确认可用性')
      const name = data.fileName ?? '', sha1 = data.hashes?.find(h => h.algo === 1)?.value ?? ''
      if (!name || /[/\\\x00-\x1f]/.test(name) || name === '.' || name === '..') throw new Error('文件名无效')
      if (!Number.isSafeInteger(data.fileLength) || data.fileLength! <= 0 || !/^[a-f\d]{40}$/i.test(sha1)) throw new Error('文件缺少有效大小或 SHA1，无法安全下载')
      if (new URL(data.downloadUrl).protocol !== 'https:') throw new Error('文件下载地址无效')
      return { fileName: name, url: data.downloadUrl, sha1, size: data.fileLength! }
    } catch (error) { signal?.throwIfAborted(); last = error }
  }
  throw new Error(`CurseForge ${projectID}/${fileID}：${last instanceof Error ? last.message : String(last)}`)
}
