import { db } from '../../utils/db'
import { exportDB } from 'dexie-export-import'

self.onmessage = async () => {
  const blob = await exportDB(db)
  self.postMessage(blob)
}
