import commit from './commit'
import pull from './pull'
import listNeedUpload from './listNeedUpload'
import uploadModifiedLocalFiles from './uploadModifiedLocalFiles'
import { syncDB } from '@/utils'
import FileSystem from '@/api/fileSystem'
import { globalStore } from '@/api/stores'
import syncBetweenLocalFolderAndCloudFolder from '@/api/sync/cloudClient/syncBetweenLocalFolderAndCloudFolder'
import SyncAPI from '@/api/sync'
import { ICloudSyncClient } from '@/api/sync/cloudClient/types'
import { throttle } from 'lodash'

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
const syncFolder = async (dirName: string, client: ICloudSyncClient) => {
  const res = await syncBetweenLocalFolderAndCloudFolder(dirName)
  if (res) {
    res.filesToDownload.length && (await client.downloadFile(res.filesToDownload))
    res.filesToUpload.length && (await client.uploadFile(res.filesToUpload))
  }
}
const syncLocalFiles = async () => {
  const client = SyncAPI.cloudClient()
  if (!client) return
  // await syncFolder('test', client)
  await syncFolder('imgs', client)
  await syncFolder('files', client)
  syncFolder('backup', client)
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
