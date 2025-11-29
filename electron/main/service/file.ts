import * as path from 'path'
import fs from 'fs'
import { app, shell } from 'electron'
import { digestBuffer } from '../utils'
import { join } from 'path'
import * as crypto from 'crypto'
const DEFAULT_USER_DATA_PATH = app.getPath('documents')

export const DefaultRendevozDataPath = path.join(DEFAULT_USER_DATA_PATH, 'Rendevoz')

const normalizePath = (path: string) => {
  const isExtendedLengthPath = path.startsWith('\\\\?\\')

  if (isExtendedLengthPath) {
    return path
  }

  return path.replace(/\\/g, '/')
}
const getRendeFileFolderPath = () => {
  return path.resolve(process.env.FILE_PATH || DefaultRendevozDataPath)
}
const checkFileFolderGenerated = () => {
  const folderPath = getRendeFileFolderPath()
  const filePath = path.join(folderPath, 'files')
  const imgPath = path.join(folderPath, 'imgs')
  const backupPath = path.join(folderPath, 'backup')
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, {})
  }
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath, {})
  }
  if (!fs.existsSync(imgPath)) {
    fs.mkdirSync(imgPath, {})
  }
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, {})
  }
}

const transformRendefileToLocalFilePath = (rendefile: string) => {
  if (rendefile.startsWith('rendefile')) {
    const rendevozDatabaseFilePath = path.resolve(process.env.FILE_PATH || DefaultRendevozDataPath)
    return path.join(rendevozDatabaseFilePath, rendefile.replace('rendefile://', ''))
  } else {
    return rendefile
  }
}

const deleteFile = async (filePath: string) => {
  // only delete rendefile
  if (!filePath.startsWith('rendefile')) {
    return
  }
  const realPath = transformRendefileToLocalFilePath(filePath)
  if (!fs.existsSync(realPath)) {
    return
  }
  await new Promise(res => {
    fs.rm(realPath, () => {
      res(null)
    })
  })
}

const openLocalFile = async (filePath: string) => {
  const realPath = transformRendefileToLocalFilePath(filePath)
  shell.showItemInFolder(realPath)
}

const writeFile = async (data: string, filePath: string, type: 'base64' | 'utf8' | 'binary') => {
  checkFileFolderGenerated()
  const folderPath = getRendeFileFolderPath()
  const absolutePath = path.join(folderPath, filePath)
  const protocolPath = absolutePath.replace(folderPath, 'rendefile://')
  return new Promise(resolve => {
    // writeFileWithUniqueName(absolutePath, data, type).then(path => {
    //   resolve(normalizePath(path.replace(folderPath, 'rendefile://')))
    // })
    fs.writeFile(absolutePath, data, { encoding: type }, () => {
      resolve(normalizePath(protocolPath))
    })
  })
}

const copyFile = async (from: string, to: string) => {
  checkFileFolderGenerated()
  const folderPath = getRendeFileFolderPath()
  const absolutePath = path.join(folderPath, to)
  const protocolPath = 'rendefile://' + to
  return new Promise(resolve => {
    // copyFileWithUniqueName(from, absolutePath).then(path => {
    //   resolve(normalizePath(path.replace(folderPath, 'rendefile://')))
    // })
    fs.copyFile(from, absolutePath, () => {
      resolve(normalizePath(protocolPath))
    })
  })
}

const openFolder = async (folderPath: string) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath)
  }
  shell.showItemInFolder(folderPath)
}

// read imgs, files, backup or root
const readDir = async (directoryPath: string) => {
  checkFileFolderGenerated()
  const dirPath = path.join(getRendeFileFolderPath(), directoryPath)
  if (!fs.existsSync(dirPath)) {
    return {
      dirState: {
        totalSize: 0
      },
      files: []
    }
  }
  return new Promise(res => {
    fs.readdir(dirPath, (err, files) => {
      if (files) {
        Promise.all(
          files.map(f => {
            return new Promise(res => {
              const filePath = join(dirPath, f)
              fs.stat(filePath, (err, data) => {
                res({
                  mtime: data.mtime.getTime(),
                  ctime: data.ctime.getTime(),
                  size: data.size,
                  name: f
                })
              })
            })
          })
        ).then(data =>
          res({
            dirState: {
              totalSize: data.reduce((prev, curr) => prev + curr.size, 0)
            },
            files: data
          })
        )
      } else {
        return {
          dirState: {
            totalSize: 0
          },
          files: []
        }
      }
    })
  })
}

const readFile = async (filePath: string) => {
  let p = filePath
  if (filePath.startsWith('rendefile://')) {
    const replaced = filePath.replace('rendefile://', '')
    p = path.join(getRendeFileFolderPath(), replaced)
  }
  return new Promise(res => {
    fs.readFile(p, (err, data) => {
      if (err) {
        console.error(err)
        res(undefined)
        return
      }
      res(data)
    })
  })
}

const utimes = (filePath: string) => {
  let p = filePath
  if (filePath.startsWith('rendefile://')) {
    const replaced = filePath.replace('rendefile://', '')
    p = path.join(getRendeFileFolderPath(), replaced)
  }
  console.log(p)
  fs.utimes(p, new Date(), new Date(), () => {})
}
const stat = async (filePath: string) => {
  let p = filePath
  if (filePath.startsWith('rendefile://')) {
    const replaced = filePath.replace('rendefile://', '')
    p = path.join(getRendeFileFolderPath(), replaced)
  }
  return new Promise(res => {
    fs.stat(p, (err, data) => {
      if (err) {
        res(undefined)
        return
      }
      res({
        mtime: data.mtime.getTime(),
        ctime: data.ctime.getTime(),
        size: data.size,
        name: path.basename(p)
      })
    })
  })
}
const FileService = {
  deleteFile,
  utimes,
  stat,
  openLocalFile,
  readDir,
  copyFile,
  readFile,
  writeFile,
  openFolder,
  getRendeFileFolderPath
}
async function copyFileWithUniqueName(from: string, to: string): Promise<string> {
  let fileDir = path.dirname(to)
  let baseName = path.basename(to, path.extname(to))
  let extName = path.extname(to)
  let uniquePath = to
  let counter = 1
  while (fs.existsSync(uniquePath)) {
    uniquePath = path.join(fileDir, `${baseName}(${counter})${extName}`)
    counter++
  }

  // 写入文件
  return await new Promise(res =>
    fs.copyFile(from, uniquePath, () => {
      res(uniquePath)
    })
  )
}

async function writeFileWithUniqueName(filePath: string, content: string, type: 'base64' | 'utf8' | 'binary'): Promise<string> {
  let fileDir = path.dirname(filePath)
  let baseName = path.basename(filePath, path.extname(filePath))
  let extName = path.extname(filePath)
  let uniquePath = filePath
  let counter = 1
  while (fs.existsSync(uniquePath)) {
    uniquePath = path.join(fileDir, `${baseName}(${counter})${extName}`)
    counter++
  }

  // 写入文件
  return await new Promise(res =>
    fs.writeFile(uniquePath, content, { encoding: type }, () => {
      res(uniquePath)
    })
  )
}

export default FileService
