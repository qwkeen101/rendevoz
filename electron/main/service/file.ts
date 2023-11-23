import * as path from 'path'
import fs from 'fs'
import { shell } from 'electron'
import { digestBuffer } from '../utils'
import { join } from 'path'

const DEFAULT_USER_DATA_PATH =
  process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share')
export const DefaultRendevozDataPath = path.join(DEFAULT_USER_DATA_PATH, 'rendevoz')

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
  const realPath = transformRendefileToLocalFilePath(filePath)
  await new Promise(res => {
    fs.rm(realPath, () => {
      res(null)
    })
  })
}

const openLocalFile = async (filePath: string) => {
  const realPath = transformRendefileToLocalFilePath(filePath)
  await shell.openPath(realPath)
}

const writeFile = async (data: string, filePath: string, type?: 'base64' | 'utf8' | 'binary') => {
  checkFileFolderGenerated()
  const folderPath = getRendeFileFolderPath()
  const absolutePath = path.join(folderPath, filePath)
  const protocolPath = 'rendefile://' + filePath
  return new Promise(resolve => {
    fs.writeFile(absolutePath, data, { encoding: type }, () => {
      resolve(protocolPath)
    })
  })
}

const copyFile = async (from: string, to: string) => {
  checkFileFolderGenerated()
  const folderPath = getRendeFileFolderPath()
  const absolutePath = path.join(folderPath, to)
  const protocolPath = 'rendefile://' + to
  return new Promise(resolve => {
    fs.copyFile(from, absolutePath, () => {
      resolve(protocolPath)
    })
  })
}

const saveBuffer = async (
  buffer: Buffer | ArrayBuffer,
  fileName: string,
  filePath?: string,
  fileSavePath: 'files' | 'imgs' | 'backup' | 'root' = 'files'
) => {
  checkFileFolderGenerated()
  const folderPath = getRendeFileFolderPath()
  const rendevozFilePath = path.join(folderPath, fileSavePath === 'root' ? '' : fileSavePath)
  const savePath = `/${fileSavePath}/`
  const finalPathName =
    filePath
      ?.replace('rendefile://', '')
      .replace('file://', '')
      .replace(rendevozFilePath, '')
      .replace('/rendevoz', '')
      .replace(savePath, '') || fileName
  const newPath = path.join(rendevozFilePath, finalPathName)

  const protocolPath = 'rendefile://' + savePath + finalPathName
  return new Promise(resolve => {
    if (buffer instanceof ArrayBuffer) {
      fs.writeFile(newPath, Buffer.from(buffer), () => {
        resolve(protocolPath)
      })
    } else {
      fs.writeFile(newPath, buffer, () => {
        resolve(protocolPath)
      })
    }
  })
}

const saveImage = async (imgName: string, imgData: string) => {
  checkFileFolderGenerated()
  const imgPath = path.join(getRendeFileFolderPath(), 'imgs')
  const data = imgData.split(',').pop()
  const buf = Buffer.from(data, 'base64')
  const digest = digestBuffer(buf)
  const newPath = path.join(imgPath, `${digest}.png`)

  const protocolPath = 'rendefile://' + '/imgs/' + `${digest}.png`

  if (!fs.existsSync(newPath)) {
    return new Promise(resolve => {
      fs.writeFile(newPath, buf, () => {
        resolve(protocolPath)
      })
    })
  } else {
    return protocolPath
  }
}

const saveFile = async (filePath: string, fileName: string) => {
  checkFileFolderGenerated()
  const rendevozFilePath = path.join(getRendeFileFolderPath(), 'files')
  const newPath = path.join(rendevozFilePath, fileName)

  const protocolPath = 'rendefile://' + '/files/' + fileName
  if (!fs.existsSync(newPath)) {
    return new Promise(resolve => {
      fs.copyFile(filePath, newPath, () => {
        resolve(protocolPath)
      })
    })
  } else {
    return protocolPath
  }
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
  return new Promise(res => {
    fs.readdir(dirPath, (err, files) => {
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
    })
  })
}

const FileService = {
  deleteFile,
  openLocalFile,
  saveFile,
  readDir,
  saveBuffer,
  copyFile,
  saveImage,
  writeFile,
  openFolder,
  getRendeFileFolderPath
}

export default FileService
