import WebdavSync from '@/api/sync/cloudClient/webdav'
import { ICloudSyncClient } from '@/api/sync/cloudClient/types'
import SyncAPI from '@/api/sync'
import { getSetting } from '@/core'
import S3Sync from '@/api/sync/cloudClient/s3'

export default function getCloudClient() {
  const setting = getSetting()
  if (setting.sync.enableSync) {
    const mode = setting.sync.syncMode ?? 's3'
    if (mode === 's3') {
      const config = setting.sync.S3Config
      if (config && config.sk && config.ak && config.endpoint && config.bucket && config.region) {
        S3Sync.registerClient({
          sk: config.sk!,
          ak: config.ak!,
          endpoint: config.endpoint!,
          bucket: config.bucket!,
          region: config.region!
        })
        return {
          ...S3Sync,
          downloadFile: async (filePath, opts) => {
            return await S3Sync.downloadFile(filePath, {
              ...opts,
              onProgress: (t, p, size) => {
                if (t === 'start') {
                  SyncAPI.file.changeState('downloading', p, 0, size)
                } else {
                  SyncAPI.file.changeState('downloading', p, 1)
                }
              }
            })
          },
          uploadFile: async (filePath, opts) => {
            return await S3Sync.uploadFile(filePath, {
              ...opts,
              onProgress: (t, p, size) => {
                if (t === 'start') {
                  SyncAPI.file.changeState('uploading', p, 0, size)
                } else if (t === 'finish') {
                  SyncAPI.file.changeState('uploading', p, 1)
                } else if (t === 'skipped') {
                  SyncAPI.file.changeState('uploading', p, 0, size, true)
                }
              }
            })
          }
        } as ICloudSyncClient
      }
    }
    if (mode === 'webdav') {
      const config = setting.sync.webdavConfig
      if (config && config.url && config.password && config.username) {
        WebdavSync.registerClient({
          username: config.username!,
          password: config.password!,
          url: config.url!
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
                } else if (t === 'finish') {
                  SyncAPI.file.changeState('uploading', p, 1)
                } else if (t === 'skipped') {
                  SyncAPI.file.changeState('uploading', p, 0, size, true)
                }
              }
            })
          }
        } as ICloudSyncClient
      }
    }
  }
}
