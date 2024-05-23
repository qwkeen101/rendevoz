import WebdavSync from '@/api/sync/cloudClient/webdav'
import { ICloudSyncClient } from '@/api/sync/cloudClient/types'
import SyncAPI from '@/api/sync'
import { getSetting } from '@/core'
import S3Sync from '@/api/sync/cloudClient/s3'
import { LocalFileSizeMap } from '@/api/sync/file/listNeedUpload'

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
          region: config.region!,
          defaultFolder: config.defaultFolder
        })
        return {
          ...S3Sync,
          downloadFile: async (filePath, opts) => {
            return await S3Sync.downloadFile(filePath, {
              ...opts,
              onProgress: (t, p, size) => {
                if (t === 'error') {
                  SyncAPI.file.changeState('downloading', p, {
                    error: true,
                    size
                  })
                  return
                }
                if (t === 'start') {
                  SyncAPI.file.changeState('downloading', p, {
                    progress: 0,
                    size
                  })
                } else {
                  if (size !== undefined) {
                    LocalFileSizeMap.set(p, size)
                  }
                  setTimeout(
                    () =>
                      SyncAPI.file.changeState('downloading', p, {
                        progress: 1,
                        size
                      }),
                    200
                  )
                }
              }
            })
          },
          uploadFile: async (filePath, opts) => {
            return await S3Sync.uploadFile(filePath, {
              ...opts,
              onProgress: (t, p, size) => {
                if (t === 'start') {
                  SyncAPI.file.changeState('uploading', p, {
                    progress: 0,
                    size
                  })
                } else if (t === 'finish') {
                  SyncAPI.file.changeState('uploading', p, {
                    progress: 1,
                    size
                  })
                } else if (t === 'skipped') {
                  SyncAPI.file.changeState('uploading', p, {
                    progress: 0,
                    size,
                    skiped: true
                  })
                } else if (t === 'error') {
                  SyncAPI.file.changeState('uploading', p, {
                    error: true,
                    size
                  })
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
          url: config.url!,
          defaultFolder: config.defaultFolder
        })
        return {
          ...WebdavSync,
          downloadFile: async (filePath, opts) => {
            return await WebdavSync.downloadFile(filePath, {
              ...opts,
              onProgress: (t, p, size) => {
                if (t === 'error') {
                  SyncAPI.file.changeState('downloading', p, {
                    error: true,
                    size
                  })
                }
                if (t === 'start') {
                  SyncAPI.file.changeState('downloading', p, {
                    progress: 0,
                    size
                  })
                } else {
                  if (size !== undefined) {
                    LocalFileSizeMap.set(p, size)
                  }
                  setTimeout(
                    () =>
                      SyncAPI.file.changeState('downloading', p, {
                        progress: 1,
                        size
                      }),
                    200
                  )
                }
              }
            })
          },
          uploadFile: async (filePath, opts) => {
            return await WebdavSync.uploadFile(filePath, {
              ...opts,
              onProgress: (t, p, size) => {
                if (t === 'start') {
                  SyncAPI.file.changeState('uploading', p, {
                    progress: 0,
                    size
                  })
                } else if (t === 'finish') {
                  SyncAPI.file.changeState('uploading', p, {
                    progress: 1,
                    size
                  })
                } else if (t === 'skipped') {
                  SyncAPI.file.changeState('uploading', p, {
                    progress: 0,
                    skiped: true,
                    size
                  })
                } else if (t === 'error') {
                  SyncAPI.file.changeState('uploading', p, {
                    size,
                    error: true
                  })
                }
              }
            })
          }
        } as ICloudSyncClient
      }
    }
  }
}
