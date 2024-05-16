export default async (): Promise<string> => {
  const w = new Worker(new URL('exportWorker.ts', import.meta.url))
  w.postMessage('')
  return await new Promise(res => {
    w.onmessage = b => {
      w.terminate()
      res(b.data)
    }
  })
}
