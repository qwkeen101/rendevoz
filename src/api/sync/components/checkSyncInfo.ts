import SyncAPI from '@/api/sync'
import syncBetweenLocalFolderAndCloudFolder from '@/api/sync/cloudClient/syncBetweenLocalFolderAndCloudFolder'
import { syncDB } from '@/utils'

export default async () => {
  const needDownload = {
    size: 0,
    count: 0
  }
  const needUpload = {
    size: 0,
    count: 0
  }
  let needSyncData = true
  const checkRemoteData = async () => {
    try {
      const remoteState = await SyncAPI.cloudClient()?.statFile('all-data.zip')
      const lastUploaded = (await syncDB.table('state').get('lastDatabaseUploaded')) as number | undefined
      const localLastModified = (await syncDB.table('state').get('lastDatabaseModified')) as number | undefined
      if (lastUploaded) {
        if (!remoteState || !remoteState.lastModified || remoteState.lastModified < lastUploaded) {
          needSyncData = false
        }
      }
      if (localLastModified) {
        if (!remoteState || !remoteState.lastModified || remoteState.lastModified < localLastModified) {
          needSyncData = false
        }
      }
    } catch (e) {
      console.error(e)
    }
  }
  const listFiles = async (dirName: string) => {
    try {
      const res = await syncBetweenLocalFolderAndCloudFolder(dirName)
      if (res) {
        needDownload.count += res.downloadState.count
        needDownload.size += res.downloadState.size
        needUpload.size += res.uploadState.size
        needUpload.count += res.uploadState.count
      }
    } catch (e) {
      console.error(e)
    }
  }
  await Promise.all([listFiles('files'), listFiles('imgs'), listFiles('backup'), checkRemoteData()])
  return {
    needSyncData,
    needDownload,
    needUpload
  }
}
