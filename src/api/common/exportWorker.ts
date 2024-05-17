import { exportDB } from 'dexie-export-import'
import { zipSync } from 'fflate'
import { db } from '../../utils/db'
self.onmessage = async () => {
  const blob = await exportDB(db)
  const u8 = new Uint8Array(await blob.arrayBuffer())
  const res = zipSync({
    'all-data.json': u8
  })
  self.postMessage(new Blob([res]))
}
