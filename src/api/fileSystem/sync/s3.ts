import { S3 } from '@aws-sdk/client-s3'
import FileSystem from '@/api/fileSystem'
import { useDb } from '@/hooks'
import { importDB } from 'dexie-export-import'
import { importRendevozDb } from '@/utils'
import exportData from '@/api/common/exportData'

type FileSyncState = {
  lastDownload: number
  lastUpload: number
}

const getFileSyncState = async (name: string): Promise<FileSyncState> => {
  const db = useDb('sync')
  const data = await db.get(name)
  return data
}
const writeFileSyncState = async (name: string, type: 'download' | 'upload') => {
  const db = useDb('sync')
  const curr = (await db.get(name)) as FileSyncState | undefined
  const now = Date.now()
  await db.put(
    { ...curr, lastUpload: type === 'upload' ? now : curr?.lastUpload, lastDownload: type === 'download' ? now : curr?.lastDownload },
    name
  )
}
const S3Sync = {
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
    const paths = Array.isArray(filePath) ? filePath : [filePath]
    if (paths.length) {
      const { endpoint, ak, sk, region, bucket } = opt
      const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
      paths.forEach(async p => {
        const file = await client.getObject({
          Key: p,
          Bucket: bucket,
          ResponseCacheControl: 'no-cache'
        })
        if (file.Body) {
          const str = await file.Body.transformToString()
          await FileSystem.fs.writeFile(str, p)
          await writeFileSyncState(p, 'download')
        }
      })
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
    }
  ) => {
    const paths = Array.isArray(filePath) ? filePath : [filePath]
    if (paths.length) {
      const { endpoint, ak, sk, region, bucket } = opt
      const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
      paths.forEach(async p => {
        const file = await FileSystem.fs.readFile('rendefile:///' + p)
        await client.putObject({
          Bucket: bucket,
          Key: p,
          Body: file
        })
        await writeFileSyncState(p, 'upload')
      })
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
    const { endpoint, ak, sk, region, bucket, protectLocal } = opt
    const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
    const remoteFiles =
      (await client
        .listObjects({
          Bucket: bucket
        })
        .then(i => i.Contents)) || []
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
