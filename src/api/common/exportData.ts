import worker from './exportWorker?worker'
export default async (): Promise<string> => {
  const w = new worker()
  w.postMessage('')
  return await new Promise(res => {
    w.onmessage = b => {
      w.terminate()
      res(b.data)
    }
  })
}
