import { createClient, FileStat, WebDAVClient } from 'webdav'
import FileSystem from '@/api/fileSystem'
import { ISystemFile } from '~/typings/fs'

export const compareDir = async () => {
  const client = createClient('https://dav.jianguoyun.com/dav/', {
    username: 'yywz.hero@qq.com',
    password: 'REDACTED'
  })
  const items = await client.getDirectoryContents('/rendevoz')
  console.log(items)
  const dirStat = await client.stat('/rendevoz', { details: true })
  console.log(dirStat)
}

const syncFiles = async (client: WebDAVClient) => {
  const fileDir = await FileSystem.fs.readdir('files')
  const clientDirExist = await client.exists('/rendevoz/files')
  if (!clientDirExist) {
    await client.createDirectory('/rendevoz/files')
  }
  const items = (await client.getDirectoryContents('/rendevoz/files')) as FileStat[]
  filterItems(fileDir.files, items)
}

const filterItems = async (
  localItems: ISystemFile[],
  remoteFiles: FileStat[]
): {
  uploadItems: string[]
  downloadItems: string[]
} => {
  const localItemsMap = new Map(localItems.map(i => [i.name, i]))
  const remoteItemsMap = new Map(remoteFiles.map(i => [i.filename, i]))
  const uploadItems: string[] = [],
    downloadItems: string[] = []
  localItemsMap.forEach(i => {})

  return {
    uploadItems: [],
    downloadItems: []
  }
}

const syncImgs = async (client: WebDAVClient) => {
  const fileDir = await FileSystem.fs.readdir('imgs')
}

const syncBackups = async (client: WebDAVClient) => {
  const fileDir = await FileSystem.fs.readdir('backup')
}
