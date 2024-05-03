import { _Object, S3 } from '@aws-sdk/client-s3'
import FileSystem from '@/api/fileSystem'
import { getSetting } from '@/core'
import { ICloudSyncClient } from '@/api/sync/cloudClient/types'

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
    const { ak, sk, endpoint, bucket, region } = opt
    const client = new S3({ credentials: { accessKeyId: ak, secretAccessKey: sk }, endpoint, region })
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
  statFile: async filePath => {
    const { client, bucket } = getClient()
    const res = await client.headObject({ Bucket: bucket, Key: filePath })
    return {
      size: res.ContentLength,
      lastModified: res.LastModified?.getTime()
    }
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
  downloadFile: async (filePath, opts) => {
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
            opts?.onProgress?.('start', p, res.ContentLength ?? 0)
            const arr = await res.Body.transformToByteArray()
            await FileSystem.fs.writeFile(arr, p)
            opts?.onProgress?.('finish', p)
          }
        })
      )
    }
  },
  isConnected: async () => {
    try {
      const client = getClient()
      await client.client.listObjectsV2({ Bucket: client.bucket, MaxKeys: 0 })
      return true
    } catch (e) {
      return false
    }
  },
  // do not need rendefile
  uploadFile: async (filePath, opts) => {
    const { client, bucket } = getClient()
    const paths = Array.isArray(filePath) ? filePath : [filePath]
    if (paths.length) {
      const maxSize = getSetting().sync.maxSyncSize
      await Promise.all(
        paths.map(async p => {
          if (maxSize && opts?.skipSetting !== true) {
            const stat = await FileSystem.fs.stat('rendefile://' + p)
            if (stat.size / (1024 * 1024) > maxSize) {
              opts?.onProgress?.('skipped', p, stat.size)
              return
            }
          }
          const file = await FileSystem.fs.readFile('rendefile:///' + p)
          opts?.onProgress?.('start', p, file.length)
          await client.putObject({
            Bucket: bucket,
            Key: p,
            Body: file
          })
          opts?.onProgress?.('finish', p)
        })
      )
    }
  }
}

export default S3Sync
