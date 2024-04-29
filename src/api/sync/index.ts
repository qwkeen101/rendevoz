import DatabaseSync from './db'
import FileSync from './file'
import NoteSync from './note'
import commitSyncOp from './commitSyncOp'
import pull from './pull'
import cloudClient from './cloudClient'
import { atom } from 'jotai/index'
import restoreFromDB from './restoreFromDB'
const SyncAPI = {
  database: DatabaseSync,
  file: FileSync,
  note: NoteSync,
  restoreFromDB,
  commitSyncOp,
  cloudClient,
  pull,
  stateAtom: atom<{
    needDownload: number
    downloaded: number
    uploading: Record<string, { name: string; size: number; progress: number; skiped?: boolean }>
    downloading: Record<string, { name: string; size: number; progress: number }>
    needUpload: number
    synced: boolean
    uploaded: number
    connected: boolean
    lastSynced?: number
  }>({
    needDownload: 0,
    downloaded: 0,
    uploading: {},
    downloading: {},
    needUpload: 0,
    uploaded: 0,
    synced: false,
    connected: false
  })
}

export default SyncAPI
