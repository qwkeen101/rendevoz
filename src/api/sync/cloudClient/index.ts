import WebdavSync from '@/api/sync/cloudClient/webdav'
import { ICloudSyncClient } from '@/api/sync/cloudClient/types'
import SyncAPI from '@/api/sync'

export default function getCloudClient() {
  WebdavSync.registerClient({
    username: 'attiley',
    password: 'REDACTED',
    url: 'https://bora.teracloud.jp/dav/',
    defaultFolder: 'rendevoz'
  })
  return {
    ...WebdavSync,
    downloadFile: async (filePath, opts) => {
      return await WebdavSync.downloadFile(filePath, {
        ...opts,
        onProgress: (t, p, size) => {
          if (t === 'start') {
            SyncAPI.file.changeState('downloading', p, 0, size)
          } else {
            SyncAPI.file.changeState('downloading', p, 1)
            SyncAPI.file.writeFileSyncState(p, 'download')
          }
        }
      })
    },
    uploadFile: async (filePath, opts) => {
      return await WebdavSync.uploadFile(filePath, {
        ...opts,
        onProgress: (t, p, size) => {
          if (t === 'start') {
            SyncAPI.file.changeState('uploading', p, 0, size)
          } else {
            SyncAPI.file.changeState('uploading', p, 1)
            SyncAPI.file.writeFileSyncState(p, 'upload')
          }
        }
      })
    }
  } as ICloudSyncClient
}
