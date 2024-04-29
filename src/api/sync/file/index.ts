import commit from './commit'
import pull from './pull'
import sync from './sync'
import listNeedUpload from './listNeedUpload'
import uploadModifiedLocalFiles from './uploadModifiedLocalFiles'
import { syncDB } from '@/utils'
import FileSystem from '@/api/fileSystem'
import { globalStore } from '@/api/stores'
import S3Sync from '@/api/sync/methods/s3'
import syncBetweenLocalFolderAndCloudFolder from '@/api/sync/cloudClient/syncBetweenLocalFolderAndCloudFolder'
import SyncAPI from '@/api/sync'

export type FileSyncState = {
  lastDownload: number
  lastUpload: number
}
const changeState = (type: 'downloading' | 'uploading', name: string, progress: number, size?: number, skiped?: boolean) => {
  const currState = globalStore.get(S3Sync.stateAtom)
  globalStore.set(S3Sync.stateAtom, {
    ...currState,
    [type]: {
      ...currState[type],
      [name]: {
        progress,
        skiped,
        name: name,
        size: size ?? currState[type][name]?.size ?? 0
      }
    }
  })
}
const getFileSyncState = async (name: string): Promise<FileSyncState> => {
  const db = syncDB.table('sync')
  const data = await db.get(name)
  return data
}
const writeFileSyncState = async (name: string, type: 'download' | 'upload') => {
  const db = syncDB.table('sync')
  const curr = (await db.get(name)) as FileSyncState | undefined
  await db.put(
    {
      ...curr,
      lastUpload: type === 'upload' ? Date.now() : curr?.lastUpload,
      lastDownload: type === 'download' ? (await FileSystem.fs.stat('rendefile://' + name)).mtime : curr?.lastDownload
    },
    name
  )
}

const syncLocalFiles = async () => {
  const client = SyncAPI.cloudClient()
  const imgRes = await syncBetweenLocalFolderAndCloudFolder('imgs')
  if (imgRes) {
    imgRes.filesToDownload.length && (await client.downloadFile(imgRes.filesToDownload))
    imgRes.filesToUpload.length && (await client.uploadFile(imgRes.filesToUpload))
  }
  const fileRes = await syncBetweenLocalFolderAndCloudFolder('files')
  if (fileRes) {
    fileRes.filesToDownload.length && (await client.downloadFile(fileRes.filesToDownload))
    fileRes.filesToUpload.length && (await client.uploadFile(fileRes.filesToUpload))
  }
}
const FileSync = {
  commit,
  pull,
  getFileSyncState,
  changeState,
  writeFileSyncState,
  syncLocalFiles,
  listNeedUpload,
  uploadModifiedLocalFiles
}

export default FileSync
