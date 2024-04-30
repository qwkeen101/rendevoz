import { _Object, S3 } from '@aws-sdk/client-s3'
import FileSystem from '@/api/fileSystem'
import { importRendevozDb, syncDB } from '@/utils'
import exportData from '@/api/common/exportData'
import { atom } from 'jotai'
import { globalStore } from '@/api/stores'
import { getSetting } from '@/core'
import { ICloudSyncClient } from '@/api/sync/cloudClient/types'
import SyncAPI from '@/api/sync'

const getClient = () => {
  const client = S3Sync.client
  const bucket = S3Sync.bucket
  if (!client || !bucket) {
    throw 'Client is not registered!'
  }
  return {
    client,
    bucket
  }
}
const S3Sync: ICloudSyncClient & {
  registerClient: (opt: { ak: string; sk: string; bucket: string; endpoint: string; region: string }) => void
  client?: S3
  bucket?: string
} = {
  registerClient: opt => {
    const { ak, sk, region, endpoint, bucket } = opt
    const client = new S3({ region: region, endpoint: endpoint, credentials: { accessKeyId: ak, secretAccessKey: sk } })
    S3Sync.client = client
    S3Sync.bucket = bucket
  },
  deleteFile: async fileName => {
    const { client, bucket } = getClient()
    const paths = Array.isArray(fileName) ? fileName : [fileName]
    await client.deleteObjects({
      Bucket: bucket,
      Delete: {
        Objects: paths.map(i => ({ Key: i }))
      }
    })
  },
  getFile: async fileName => {
    const { client, bucket } = getClient()
    const res = await client.getObject({
      Bucket: bucket,
      Key: fileName
    })
    if (res.Body) {
      return await res.Body.transformToString()
    }
  },
  listFolder: async (dirName, startAfter) => {
    const { client, bucket } = getClient()
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
      .filter(i => i.Key)
      .map(i => ({
        key: i.Key!,
        size: i.Size,
        lastModified: i.LastModified?.getTime?.()
      }))
  },
  getFileAsBuffer: async filePath => {
    const { client, bucket } = getClient()
    const res = await client.getObject({
      Bucket: bucket,
      Key: filePath
    })
    if (res.Body) {
      return (await res.Body.transformToByteArray()).buffer
    }
  },
  uploadData: async (path, data) => {
    const { client, bucket } = getClient()
    await client.putObject({
      Key: path,
      Body: data,
      Bucket: bucket
    })
  },
  downloadFile: async filePath => {
    const { client, bucket } = getClient()
    const paths = Array.isArray(filePath) ? filePath : [filePath]
    if (paths.length) {
      await Promise.all(
        paths.map(async p => {
          const res = await client.getObject({
            Bucket: bucket,
            Key: p,
            ResponseCacheControl: 'no-cache'
          })
          if (res.Body) {
            SyncAPI.file.changeState('downloading', p, 0, res.ContentLength)
            const arr = await res.Body.transformToByteArray()
            await FileSystem.fs.writeFile(arr, p)
            SyncAPI.file.writeFileSyncState(p, 'download')
            SyncAPI.file.changeState('downloading', p, 1)
          }
        })
      )
    }
  },
  // do not need rendefile
  uploadFile: async (filePath, skipSetting) => {
    const { client, bucket } = getClient()
    const paths = Array.isArray(filePath) ? filePath : [filePath]
    if (paths.length) {
      const maxSize = getSetting().sync.maxSyncSize
      await Promise.all(
        paths.map(async p => {
          if (maxSize && skipSetting !== true) {
            const stat = await FileSystem.fs.stat('rendefile://' + p)
            if (stat.size / (1024 * 1024) > maxSize) {
              SyncAPI.file.changeState('uploading', p, 0, stat.size, true)
              return
            }
          }
          const file = await FileSystem.fs.readFile('rendefile:///' + p)
          SyncAPI.file.changeState('uploading', p, 0, file.length)
          await client.putObject({
            Bucket: bucket,
            Key: p,
            Body: file
          })
          SyncAPI.file.changeState('uploading', p, 1)
          await SyncAPI.file.writeFileSyncState(p, 'upload')
        })
      )
    }
  }
}

export default S3Sync
