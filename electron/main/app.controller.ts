import { Controller, Get, Inject } from '@nestjs/common'
import { WebContents, BrowserWindow } from 'electron'
import { AppService } from './app.service'
import { IpcInvoke } from './transport'
import fs from 'fs'
import path from 'path'
import { autoUpdater } from 'electron-updater'

export const DEFAULT_USER_DATA_PATH =
  process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share')

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, @Inject('WEB_CONTENTS') private readonly webContents: WebContents) {}
  @IpcInvoke('reload')
  public reload() {
    this.webContents.reload()
  }
  @IpcInvoke('maximizeWindow')
  public async maximizeWindow() {
    if (BrowserWindow.getFocusedWindow()?.isMaximized()) {
      BrowserWindow.getFocusedWindow()?.unmaximize()
    } else {
      BrowserWindow.getFocusedWindow()?.maximize()
    }
  }
  @IpcInvoke('minimizeWindow')
  public async minimizeWindow() {
    BrowserWindow.getFocusedWindow()?.minimize()
  }
  @IpcInvoke('sourceId')
  public getSourceId() {
    return BrowserWindow.getFocusedWindow().getMediaSourceId()
  }
  @IpcInvoke('msg')
  public async handleSendMsg(msg: string): Promise<string> {
    this.webContents.send('reply-msg', 'this is msg from webContents.send')
    return `The main process received your message: ${msg} at time: ${this.appService.getTime()}`
  }
  @IpcInvoke('readPdf')
  public async pdfFile(fileUrl: string) {
    return new Promise((resolve, reject) => {
      fs.readFile(fileUrl, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }
  @IpcInvoke('copyPdf')
  public async copyPdfFile(originPath: string, originName: string) {
    this.checkIfRendevozGenerated()
    const filePath = path.join(DEFAULT_USER_DATA_PATH, 'rendevoz', 'files')
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, {})
    }
    const newPath = path.join(filePath, originName)
    if (!fs.existsSync(newPath)) {
      return new Promise(resolve => {
        fs.copyFile(originPath, newPath, () => {
          resolve(newPath)
        })
      })
    } else {
      return newPath
    }
  }

  @IpcInvoke('saveImage')
  public async saveImage(imgName: string, imgData: string) {
    this.checkIfRendevozGenerated()
    const imgPath = path.join(DEFAULT_USER_DATA_PATH, 'rendevoz', 'imgs')
    if (!fs.existsSync(imgPath)) {
      fs.mkdirSync(imgPath, {})
    }
    const newPath = path.join(imgPath, `${imgName}.png`)
    const absolutePath = path.resolve(newPath)
    const protocolPath = 'rendefile://' + absolutePath
    const data = imgData.split(',').pop()
    const buf = Buffer.from(data, 'base64')
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

  @IpcInvoke('saveFile')
  public async saveFile(filePath: string, fileName: string) {
    this.checkIfRendevozGenerated()
    const rendevozFilePath = path.join(DEFAULT_USER_DATA_PATH, 'rendevoz', 'files')
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, {})
    }
    const newPath = path.join(rendevozFilePath, fileName)
    const absolutePath = path.resolve(newPath)
    const protocolPath = 'rendefile://' + absolutePath
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

  @IpcInvoke('getUpdateDetails')
  public async getUpdateDetails() {
    const result = await autoUpdater.checkForUpdates()
    return result.updateInfo
  }
  @IpcInvoke('updateAndInstall')
  public async updateAndInstall() {
    try {
      const result = await autoUpdater.downloadUpdate()
      return result
    } catch (e) {
      autoUpdater.quitAndInstall()
    }
  }
  private checkIfRendevozGenerated = () => {
    const rendevozPath = path.join(DEFAULT_USER_DATA_PATH, 'rendevoz')
    if (!fs.existsSync(rendevozPath)) {
      fs.mkdirSync(rendevozPath, {})
    }
  }
  private getRendevozFilePath = () => {
    const rendevozPath = path.join(DEFAULT_USER_DATA_PATH, 'rendevoz')
    if (!fs.existsSync(rendevozPath)) {
      fs.mkdirSync(rendevozPath, {})
    }
    return rendevozPath
  }
}
