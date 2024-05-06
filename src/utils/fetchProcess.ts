export type DownloadProgress = {
  total: number
  transferred: number
  speed: number
  eta: number
  remaining: number
  percentage: number
}

export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default async (res: Response, onProgress?: (progress: number) => void) => {
  const total = parseInt(res.headers.get('Content-Length') ?? '0', 10)
  const reader = res.body?.getReader()
  if (!reader) return await res.blob()
  let received = 0
  let chunks = []
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    chunks.push(value)
    received += value.length
    onProgress?.(received / total)
  }
  const all = new Uint8Array(received)
  let pos = 0
  for (const chunk of chunks) {
    all.set(chunk, pos)
    pos += chunk.length
  }
  return new Blob([all])
}
