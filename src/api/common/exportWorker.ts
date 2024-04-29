import { db } from '../../utils/db'
import { exportDB } from 'dexie-export-import'

self.onmessage = async () => {
  const blob = await exportDB(db)
  const compressedStream = blob.stream().pipeThrough(new CompressionStream('gzip'))
  const res = await new Response(compressedStream).blob()
  self.postMessage(res)
}
