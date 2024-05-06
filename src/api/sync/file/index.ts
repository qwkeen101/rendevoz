import commit from './commit'
import pull from './pull'
import listNeedUpload from './listNeedUpload'
import uploadModifiedLocalFiles from './uploadModifiedLocalFiles'
import { syncDB } from '@/utils'
import FileSystem from '@/api/fileSystem'
import { globalStore } from '@/api/stores'
import syncBetweenLocalFolderAndCloudFolder from '@/api/sync/cloudClient/syncBetweenLocalFolderAndCloudFolder'
import SyncAPI from '@/api/sync'

export type FileSyncState = {
  lastDownload: number
  lastUpload: number
}
const changeState = (type: 'downloading' | 'uploading', name: string, progress: number, size?: number, skiped?: boolean) => {
  const currState = globalStore.get(SyncAPI.stateAtom)
  globalStore.set(SyncAPI.stateAtom, {
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
const syncLocalFiles = async () => {
  const client = SyncAPI.cloudClient()
  if (!client) return
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
  changeState,
  syncLocalFiles,
  listNeedUpload,
  uploadModifiedLocalFiles
}

export default FileSync
