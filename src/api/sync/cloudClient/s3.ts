import { _Object, S3 } from '@aws-sdk/client-s3'
import FileSystem from '@/api/fileSystem'
import { getSetting } from '@/core'
import { ICloudSyncClient } from '@/api/sync/cloudClient/types'
import { pathJoin, pathNormalize, pathRemoveLeading, pathRemoveLeadingSlash } from '@/api/sync/utils/path'
import { Queue } from 'async-await-queue'
import { Simulate } from 'react-dom/test-utils'
import cancel = Simulate.cancel
import Id from '@/utils/id'
import GlobalStates from '@/api/global/states'
import SyncAPI from '@/api/sync'
const q = new Queue(2, 0)
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

const CancelFuncsMap = new Map<number, VoidFunction>()
const CancelControllersMap = new Map<number, AbortController>()
const addLeading = (str: string) => {
  const folder = pathNormalize(S3Sync.defaultFolder ?? '', false)
  if (str.startsWith(folder)) {
    return pathRemoveLeadingSlash(str)
  }
  return pathRemoveLeadingSlash(pathNormalize(pathJoin([folder, str]), false))
}
const removeLeading = (str: string) => {
  const folder = S3Sync.defaultFolder ?? ''
  return pathRemoveLeading(str, folder, true)
}
const S3Sync: ICloudSyncClient & {
  registerClient: (opt: { ak: string; sk: string; bucket: string; endpoint: string; region: string; defaultFolder?: string }) => void
  client?: S3
  defaultFolder?: string
  bucket?: string
} = {
  registerClient: opt => {
    const { ak, sk, endpoint, bucket, region, defaultFolder } = opt
    const client = new S3({ credentials: { accessKeyId: ak, secretAccessKey: sk }, endpoint, region })
    S3Sync.client = client
    S3Sync.bucket = bucket
    S3Sync.defaultFolder = defaultFolder
  },
  cancelAllTasks: () => {
    Array.from(CancelControllersMap.values()).forEach(f => {
      f.abort()
    })
    Array.from(CancelFuncsMap.values()).forEach(f => {
      f()
    })
    CancelFuncsMap.clear()
    CancelControllersMap.clear()
  },
  deleteFile: async fileName => {
    const { client, bucket } = getClient()
    const paths = Array.isArray(fileName) ? fileName : [fileName]
    await client.deleteObjects({
      Bucket: bucket,
      Delete: {
        Objects: paths.map(i => ({ Key: addLeading(i) }))
      }
    })
  },
  statFile: async filePath => {
    const { client, bucket } = getClient()
    const res = await client.headObject({ Bucket: bucket, Key: addLeading(filePath) })
    return {
      size: res.ContentLength,
      lastModified: res.LastModified?.getTime()
    }
  },
  getFile: async fileName => {
    const { client, bucket } = getClient()
    const res = await client.getObject({
      Bucket: bucket,
      Key: addLeading(fileName),
      ResponseCacheControl: 'no-cache'
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
        Prefix: addLeading(dirName),
        ContinuationToken: token,
        StartAfter: startAfter ? addLeading(startAfter) : undefined
      })
      contents = [...contents, ...(res.Contents || [])]
      isTruncated = !!res.IsTruncated
      token = res.NextContinuationToken
    }

    return contents
      .filter(i => i.Key)
      .map(i => ({
        key: removeLeading(i.Key!),
        size: i.Size,
        lastModified: i.LastModified?.getTime?.()
      }))
  },
  getFileAsBuffer: async filePath => {
    const { client, bucket } = getClient()
    const res = await client.getObject({
      Bucket: bucket,
      Key: addLeading(filePath)
    })
    if (res.Body) {
      return (await res.Body.transformToByteArray()).buffer
    }
  },
  uploadData: async (path, data) => {
    const { client, bucket } = getClient()
    await client.putObject({
      Key: addLeading(path),
      Body: data,
      Bucket: bucket
    })
  },
  downloadFile: async (filePath, opts) => {
    const { client, bucket } = getClient()
    const paths = Array.isArray(filePath) ? filePath : [filePath]
    if (paths.length) {
      const controller = new AbortController()
      controller.signal.throwIfAborted()
      const id = Id.getId()
      const cancel = {
        current: false
      }
      CancelControllersMap.set(id, controller)
      CancelFuncsMap.set(id, () => {
        cancel.current = true
      })
      await Promise.all(
        paths.map(async p => {
          const me = `download_${p}`
          await q.wait(me, -1)
          if (cancel.current) {
            q.end(me)
            return
          }
          try {
            const res = await client.getObject(
              {
                Bucket: bucket,
                Key: addLeading(p),
                ResponseCacheControl: 'no-cache'
              },
              {
                abortSignal: controller.signal
              }
            )
            if (res.Body) {
              opts?.onProgress?.('start', p, res.ContentLength ?? 0)
              try {
                const arr = await res.Body.transformToByteArray()
                await FileSystem.fs.writeFile(arr, p)
                opts?.onProgress?.('finish', p, res.ContentLength ?? 0)
              } catch (e) {
                q.end(me)
                console.error(e)
                opts?.onProgress?.('error', p)
              }
            }
          } catch (e) {
            console.error(e)
          } finally {
            q.end(me)
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
      const controller = new AbortController()
      controller.signal.throwIfAborted()
      const cancel = {
        current: false
      }
      const id = Id.getId()
      CancelControllersMap.set(id, controller)
      CancelFuncsMap.set(id, () => {
        cancel.current = true
      })
      await Promise.all(
        paths.map(async p => {
          const me = `upload_${p}`
          // if (maxSize && opts?.skipSetting !== true) {
          //   const stat = await FileSystem.fs.stat('rendefile://' + p)
          //   if (stat.size / (1024 * 1024) > maxSize) {
          //     opts?.onProgress?.('skipped', p, stat.size)
          //     return
          //   }
          // }
          await q.wait(me, -1)
          if (cancel.current) {
            q.end(me)
            return
          }
          try {
            const file = await FileSystem.fs.readFile('rendefile:///' + p)
            if (file) {
              try {
                opts?.onProgress?.('start', p, file.length)
                await client.putObject(
                  {
                    Bucket: bucket,
                    Key: addLeading(p),
                    Body: file
                  },
                  { abortSignal: controller.signal }
                )
                opts?.onProgress?.('finish', p, file.length)
              } catch (e) {
                console.error(e)
                opts?.onProgress?.('error', p)
                q.end(me)
              }
            }
          } catch (e) {
            console.error(e)
          } finally {
            q.end(me)
          }
        })
      )
    }
  }
}

export default S3Sync
