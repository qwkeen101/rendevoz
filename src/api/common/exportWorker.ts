import Dexie from 'dexie'
import { exportDB } from 'dexie-export-import'
import { zipSync } from 'fflate'
import { APP_DB_NAME } from '../../utils/dbName'

// Open the app database by name with the schema it already has, instead of
// importing it from utils/db. That module's app-side hooks (auto-export, sync)
// pull in exportData.ts, which spawns this very worker, so Vite's worker build
// waited on itself forever ("Unexpected early exit") and dragged ~1500 app
// files into the worker.
const db = new Dexie(APP_DB_NAME)

self.onmessage = async () => {
  if (!db.isOpen()) await db.open()
  const blob = await exportDB(db)
  const u8 = new Uint8Array(await blob.arrayBuffer())
  const res = zipSync({
    'all-data.json': u8
  })
  self.postMessage(new Blob([res]))
}
