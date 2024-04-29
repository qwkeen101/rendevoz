import { _Object, S3 } from '@aws-sdk/client-s3'
import FileSystem from '@/api/fileSystem'
import { importRendevozDb, syncDB } from '@/utils'
import exportData from '@/api/common/exportData'
import { atom } from 'jotai'
import { globalStore } from '@/api/stores'
import { getSetting } from '@/core'

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
export type FileSyncState = {
  lastDownload: number
  lastUpload: number
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

const S3Sync = {
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
  }),
  deleteFile: async (
    fileName: string | string[],
    opt: {
      endpoint: string
      region: string
      ak: string
      sk: string
      bucket: string
    }
  ) => {
    const { endpoint, ak, sk, region, bucket } = opt
    const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
    const paths = Array.isArray(fileName) ? fileName : [fileName]
    return await client.deleteObjects({
      Bucket: bucket,
      Delete: {
        Objects: paths.map(i => ({ Key: i }))
      }
    })
  },
  getFile: async (
    fileName: string | string[],
    opt: {
      endpoint: string
      region: string
      ak: string
      sk: string
      bucket: string
    }
  ) => {
    const { endpoint, ak, sk, region, bucket } = opt
    const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
    const paths = Array.isArray(fileName) ? fileName : [fileName]
    return await Promise.all(
      paths.map(async p => {
        const res = await client.getObject({
          Bucket: bucket,
          Key: p
        })
        if (res.Body) {
          return await res.Body.transformToString()
        }
      })
    )
  },
  listFolder: async (
    dirName: string,
    opt: {
      endpoint: string
      region: string
      ak: string
      startAfter?: string
      sk: string
      bucket: string
    }
  ) => {
    const { endpoint, ak, sk, region, bucket, startAfter } = opt
    const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
    let isTruncated = true
    let contents: _Object[] = []
    let token = undefined
    while (isTruncated) {
      const res = await client.listObjectsV2({
        Bucket: bucket,
        Prefix: dirName,
        ContinuationToken: token,
        StartAfter: startAfter
      })
      contents = [...contents, ...(res.Contents || [])]
      isTruncated = !!res.IsTruncated
      token = res.NextContinuationToken
    }

    return contents
  },
  uploadData: async (
    path: string,
    data: string | Blob,
    opt: {
      endpoint: string
      region: string
      ak: string
      sk: string
      bucket: string
    }
  ) => {
    const { endpoint, ak, sk, region, bucket } = opt
    const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
    await client.putObject({
      Key: path,
      Body: data,
      Bucket: bucket
    })
  },
  getClientFromSetting: ():
    | {
        endpoint: string
        region: string
        ak: string
        sk: string
        bucket: string
      }
    | undefined => {
    const setting = getSetting()
    if (setting.sync.S3Config) {
      const config = setting.sync.S3Config
      if (config.ak && config.sk && config.endpoint && config.region && config.bucket) {
        return config
      }
    }
    return
  },
  syncFolder: async (dirname: string, opt: { endpoint: string; region: string; ak: string; sk: string; bucket: string }) => {
    const { bucket, ak, sk, region, endpoint } = opt
    const state = await S3Sync.syncFolderState(dirname, {
      direction: 'from remote to local',
      ak,
      sk,
      region,
      endpoint,
      bucket: bucket
    })
    if (state?.filesToUpload.length) {
      await S3Sync.uploadFile(state.filesToUpload, {
        ak,
        sk,
        region,
        endpoint,
        bucket
      })
    }
    if (state?.filesToDownload.length) {
      S3Sync.downloadFile(state.filesToDownload, {
        ak,
        sk,
        region,
        endpoint,
        bucket
      })
    }
  },
  uploadDatabase: async (opt: { endpoint: string; region: string; ak: string; sk: string; bucket: string }) => {
    const { endpoint, ak, sk, region, bucket } = opt
    const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
    const db = await exportData()
    if (db) {
      await client.putObject({
        Key: 'data.json',
        Bucket: bucket,
        Body: db
      })
    }
  },
  syncDatabase: async (opt: { endpoint: string; region: string; ak: string; sk: string; bucket: string }) => {
    const { endpoint, ak, sk, region, bucket } = opt
    const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
    const data = await client.getObject({
      Key: 'data.json',
      Bucket: bucket
    })
    if (!data.Body) {
      return
    }
    const db = await data.Body.transformToString()
    await importRendevozDb(new Blob([db]))
  },
  downloadFile: async (
    filePath: string | string[],
    opt: {
      endpoint: string
      region: string
      ak: string
      sk: string
      bucket: string
    }
  ) => {
    const { endpoint, ak, sk, region, bucket } = opt
    const paths = Array.isArray(filePath) ? filePath : [filePath]
    const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
    if (paths.length) {
      await Promise.all(
        paths.map(async p => {
          const res = await client.getObject({
            Bucket: bucket,
            Key: p,
            ResponseCacheControl: 'no-cache'
          })
          if (res.Body) {
            changeState('downloading', p, 0, res.ContentLength)
            const arr = await res.Body.transformToByteArray()
            await FileSystem.fs.writeFile(arr, p)
            writeFileSyncState(p, 'download')
            changeState('downloading', p, 1)
          }
        })
      )
    }
  },
  // do not need rendefile
  uploadFile: async (
    filePath: string | string[],
    opt: {
      endpoint: string
      region: string
      ak: string
      sk: string
      bucket: string
      skipSetting?: boolean
    }
  ) => {
    const paths = Array.isArray(filePath) ? filePath : [filePath]
    if (paths.length) {
      const { endpoint, ak, sk, region, bucket, skipSetting } = opt
      const maxSize = getSetting().sync.maxSyncSize
      const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
      await Promise.all(
        paths.map(async p => {
          if (maxSize && skipSetting !== true) {
            const stat = await FileSystem.fs.stat('rendefile://' + p)
            if (stat.size / (1024 * 1024) > maxSize) {
              changeState('uploading', p, 0, stat.size, true)
              return
            }
          }
          const file = await FileSystem.fs.readFile('rendefile:///' + p)
          changeState('uploading', p, 0, file.length)
          await client.putObject({
            Bucket: bucket,
            Key: p,
            Body: file
          })
          changeState('uploading', p, 1)
          await writeFileSyncState(p, 'upload')
        })
      )
    }
  },
  syncFolderState: async (
    dirName: string,
    opt: {
      endpoint: string
      region: string
      ak: string
      sk: string
      bucket: string
      direction?: 'from remote to local' | 'from local to remote'
      protectLocal?: boolean
    }
  ) => {
    const direction = opt.direction || 'from local to remote'
    const filesToDelete: string[] = []
    const filesToDownload: string[] = []
    const filesToUpload: string[] = []
    const { protectLocal } = opt
    const remoteFiles = await S3Sync.listFolder(dirName, opt)
    const remoteFileMap = new Map(remoteFiles.map(i => [i.Key, i]))
    const localFiles = await FileSystem.fs.readdir(dirName)
    const localFileMap = new Map(localFiles.files.map(i => [dirName + '/' + i.name, i]))
    await Promise.all(
      remoteFiles.map(async file => {
        const name = file.Key
        if (name === undefined) return
        const local = localFileMap.get(name)
        if (!local) {
          if (direction === 'from local to remote') {
            filesToDelete.push(name)
          } else {
            filesToDownload.push(name)
          }
        } else {
          if (file.LastModified) {
            const mtime = file.LastModified.getTime()
            if (mtime > local.mtime) {
              const uploadTime = (await getFileSyncState(name))?.lastUpload
              if (uploadTime && Math.abs(uploadTime - mtime) < 1000) {
                return
              }
              filesToDownload.push(name)
            }
          }
        }
      })
    )
    await Promise.all(
      localFiles.files.map(async file => {
        const name = dirName + '/' + file.name
        const remote = remoteFileMap.get(name)
        if (!remote) {
          if (protectLocal === false && direction === 'from remote to local') {
            filesToDelete.push(name)
          } else {
            filesToUpload.push(name)
          }
        } else {
          if (!remote.LastModified || file.mtime > remote.LastModified.getTime()) {
            const downloadTime = (await getFileSyncState(name))?.lastDownload
            console.log(downloadTime, file.mtime, downloadTime - file.mtime, name)
            if (downloadTime && Math.abs(downloadTime - file.mtime) < 1000) {
              return
            }
            filesToUpload.push(name)
          }
        }
      })
    )
    return {
      filesToDownload,
      filesToUpload,
      filesToDelete
    }
  }
}

export default S3Sync
