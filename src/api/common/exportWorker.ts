import { exportDB } from 'dexie-export-import'
import { zipSync } from 'fflate'
self.onmessage = async () => {
  const db = await import('@/utils/db').then(i => i.db)
  const blob = await exportDB(db)
  const u8 = new Uint8Array(await blob.arrayBuffer())
  const res = zipSync({
    'all-data.json': u8
  })
  self.postMessage(new Blob([res]))
}
