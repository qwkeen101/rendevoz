import { ICloudSyncClient } from '@/api/sync/cloudClient/types'
import * as webdav from 'webdav'
import { AuthType, FileStat, WebDAVClient } from 'webdav'
import FileSystem from '@/api/fileSystem'
import { getSetting } from '@/core'
import { getDirPath, pathJoin, pathNormalize, pathRemoveLeading } from '@/api/sync/utils/path'
import { Queue } from 'async-await-queue'
const q = new Queue(4, 0)
const getClient = () => {
  if (!WebdavSync.client) throw 'Client is not registered!'
  return WebdavSync.client
}
const addLeading = (str: string) => {
  const folder = pathNormalize(WebdavSync.defaultFolder ?? '', true)
  if (str.startsWith(folder)) {
    return str
  }
  return pathNormalize(pathJoin([folder, str]), true)
}
const removeLeading = (str: string) => {
  const folder = WebdavSync.defaultFolder ?? ''
  return pathRemoveLeading(str, folder)
}
const transformToDirPath = (str: string) => {
  str = addLeading(str)
  return getDirPath(str)
}
const checkDirCreated = async (filePath: string, isDir = false) => {
  const client = WebdavSync.client!
  const dirs = filePath.split('/').filter(i => i)
  if (!isDir) {
    dirs.pop()
  }
  const dirPath = dirs.join('/')
  try {
    if (!(await client.exists(dirPath))) {
      await client.createDirectory(dirPath, { recursive: true })
    }
  } catch (e) {
    await client.createDirectory(dirPath, { recursive: true })
  }
}
const WebdavSync: ICloudSyncClient & {
  client?: WebDAVClient
  defaultFolder?: string
  registerClient: (opts: { url: string; username: string; password: string; defaultFolder?: string }) => void
} = {
  registerClient: opts => {
    const client = webdav.createClient(opts.url, {
      username: opts.username,
      password: opts.password,
      authType: AuthType.Password
    })
    WebdavSync.defaultFolder = opts.defaultFolder
    WebdavSync.client = client
  },
  getFile: async filePath => {
    const client = getClient()
    filePath = addLeading(filePath)
    await checkDirCreated(filePath)
    const res = (await client.getFileContents(filePath, {
      format: 'text',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })) as string
    return res
  },
  deleteFile: async filePath => {
    const arr = Array.isArray(filePath) ? filePath : [filePath]
    const client = getClient()
    await Promise.all(
      arr.map(async p => {
        try {
          p = addLeading(p)
          await client.deleteFile(p)
        } catch (e) {}
      })
    )
  },
  statFile: async filePath => {
    const client = getClient()
    const res = (await client.stat(addLeading(filePath))) as FileStat
    return {
      size: res.size,
      lastModified: new Date(res.lastmod).getTime()
    }
  },
  uploadData: async (filePath, data) => {
    const client = getClient()
    filePath = addLeading(filePath)
    await checkDirCreated(filePath)
    await client.putFileContents(filePath, typeof data === 'string' ? data : await data.arrayBuffer(), { overwrite: true })
  },
  uploadFile: async (filePath, opts) => {
    const client = getClient()
    const arr = Array.isArray(filePath) ? filePath : [filePath]
    const needCheckDir = new Set(arr.map(p => transformToDirPath(p)))
    const maxSize = getSetting().sync.maxSyncSize
    await Promise.all(Array.from(needCheckDir.values()).map(async p => await checkDirCreated(p, true)))
    await Promise.all(
      arr.map(async p => {
        const me = `upload_${p}`
        await q.wait(me, -1)
        // if (maxSize && opts?.skipSetting !== true) {
        //   const stat = await FileSystem.fs.stat('rendefile://' + p)
        //   if (stat.size / (1024 * 1024) > maxSize) {
        //     opts?.onProgress?.('skipped', p, stat.size)
        //     return
        //   }
        // }
        try {
          const file = await FileSystem.fs.readFile(`rendefile://` + p)
          if (file) {
            try {
              opts?.onProgress?.('start', p, file.length)
              await client.putFileContents(addLeading(p), await new Blob([file]).arrayBuffer(), { overwrite: true })
            } catch (e) {
              console.error(e)
            } finally {
              opts?.onProgress?.('finish', p, file.length)
            }
          }
        } catch (e) {
          console.error(e)
        } finally {
          q.end(me)
        }
      })
    )
  },
  downloadFile: async (filePath, opts) => {
    const client = getClient()
    const arr = Array.isArray(filePath) ? filePath : [filePath]
    const needCheckDir = new Set(arr.map(p => transformToDirPath(p)))
    await Promise.all(Array.from(needCheckDir.values()).map(async p => await checkDirCreated(p, true)))
    await Promise.all(
      arr.map(async p => {
        const me = `download_${p}`
        const newP = addLeading(p)
        try {
          await q.wait(me, -1)
          const state = await client.stat(newP)
          if (!state) {
            q.end(me)
            return
          }
          opts?.onProgress?.('start', p, state?.size)
          const file = await client.getFileContents(newP, {
            format: 'binary',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          await FileSystem.fs.writeFile(file, p)
          opts?.onProgress?.('finish', p, state?.size ?? 0)
        } catch (e) {
          console.error(e)
        } finally {
          q.end(me)
        }
      })
    )
  },
  getFileAsBuffer: async filePath => {
    const client = getClient()
    filePath = addLeading(filePath)
    try {
      const res = (await client.getFileContents(filePath, {
        format: 'binary',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })) as ArrayBuffer
      return res
    } catch (e) {}
  },
  isConnected: async () => {
    try {
      const client = getClient()
      await client.exists('/')
      return true
    } catch (e) {
      return false
    }
  },
  listFolder: async (dirName, startAfter) => {
    try {
      const client = getClient()
      dirName = addLeading(dirName)
      console.log(dirName)
      let res = (await client.getDirectoryContents(dirName, { includeSelf: false })) as FileStat[]
      if (startAfter) {
        res.sort((a, b) => (a.filename > b.filename ? 1 : -1))
        const idx = res.findIndex(i => removeLeading(i.filename) > startAfter)
        if (idx >= 0) {
          res = res.slice(idx)
        } else {
          res = []
        }
      }
      return res.map(i => ({
        key: removeLeading(i.filename),
        lastModified: new Date(i.lastmod).getTime(),
        size: i.size
      }))
    } catch (e) {
      return []
    }
  }
}

export default WebdavSync
