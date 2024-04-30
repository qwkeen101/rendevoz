import { ICloudSyncClient } from '@/api/sync/cloudClient/types'
import * as webdav from 'webdav'
import { AuthType, FileStat, WebDAVClient } from 'webdav'
import FileSystem from '@/api/fileSystem'

const getClient = () => {
  if (!WebdavSync.client) throw 'Client is not registered!'
  return WebdavSync.client
}
const addLeading = (str: string) => {
  const folder = WebdavSync.defaultFolder ?? ''
  if (!str.startsWith(`/${folder}`)) {
    return `/${folder}` + (folder.length ? '/' : '') + str
  }
  return str
}
const removeLeading = (str: string) => {
  const folder = WebdavSync.defaultFolder ?? ''
  if (str.startsWith(`/${folder}`)) {
    return str.slice(`/${folder}`.length + (folder.length ? 1 : 0))
  }
  return str
}
const transformToDirPath = (str: string) => {
  const folder = WebdavSync.defaultFolder ?? ''
  if (!str.startsWith(`/${folder}`)) {
    str = `/${folder}` + (folder.length ? '/' : '') + str
  }
  const splitted = str.split('/')
  splitted.pop()
  const final = splitted.join('/')
  return '/' + final
}
const checkDirCreated = async (filePath: string, isDir = false) => {
  const client = WebdavSync.client!
  const dirs = filePath.split('/')
  if (!isDir) {
    dirs.pop()
  }
  const dirPath = dirs.join('/')
  console.log(dirPath)
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
        p = addLeading(p)
        await checkDirCreated(p)
        await client.deleteFile(p)
      })
    )
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
    await Promise.all(Array.from(needCheckDir.values()).map(async p => await checkDirCreated(p, true)))
    await Promise.all(
      arr.map(async p => {
        try {
          const file = await FileSystem.fs.readFile(`rendefile://` + p)
          if (file) {
            opts?.onProgress?.('start', p, file.length)
            const newP = addLeading(p)
            await client.putFileContents(newP, await new Blob([file]).arrayBuffer(), { overwrite: true })
          }
        } finally {
          opts?.onProgress?.('finish', p)
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
        try {
          const newP = addLeading(p)
          const state = await client.stat(newP)
          opts?.onProgress?.('start', p, state?.size)
          const file = await client.getFileContents(newP, {
            format: 'binary',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          await FileSystem.fs.writeFile(file, p)
        } finally {
          opts?.onProgress?.('finish', p)
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
  listFolder: async (dirName, startAfter) => {
    const client = getClient()
    dirName = addLeading(dirName)
    await checkDirCreated(dirName, true)
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
  }
}

export default WebdavSync
