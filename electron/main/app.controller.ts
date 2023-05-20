import { Controller, Inject } from '@nestjs/common'
import { WebContents, BrowserWindow, webContents, shell } from 'electron'
import { AppService } from './app.service'
import { IpcInvoke } from './transport'
import fs from 'fs'
import path from 'path'
import { autoUpdater } from 'electron-updater'
// import { franc } from 'franc'
// import { iso6393To1 } from './iso-639-to-iso-631'

export const DEFAULT_USER_DATA_PATH =
  process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share')

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, @Inject('WEB_CONTENTS') private readonly webContents: WebContents) {}
  @IpcInvoke('reload')
  public reload() {
    this.webContents.reload()
  }
  @IpcInvoke('ping')
  public a(){
    console.log('ping')
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

  @IpcInvoke('saveImage')
  public async saveImage(imgName: string, imgData: string) {
    this.checkIfRendevozGenerated()
    const imgPath = path.join(DEFAULT_USER_DATA_PATH, 'rendevoz', 'imgs')
    if (!fs.existsSync(imgPath)) {
      fs.mkdirSync(imgPath, {})
    }
    const newPath = path.join(imgPath, `${imgName}.png`)

    const protocolPath = 'rendefile://' + '/imgs/' + `${imgName}.png`
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

  @IpcInvoke('getUpdateDetails')
  public async getUpdateDetails() {
    const result = await autoUpdater.checkForUpdates()
    return result.updateInfo
  }
  @IpcInvoke('saveBuffer')
  public async saveBuffer(buffer: Buffer | ArrayBuffer, fileName: string, filePath?: string) {
    this.checkIfRendevozGenerated()
    const rendevozFilePath = path.join(DEFAULT_USER_DATA_PATH, 'rendevoz', 'files')
    const newPath = filePath?.replace('rendefile://', '').replace('file://', '') || path.join(rendevozFilePath, fileName)
    const absolutePath = path.resolve(newPath)
    // const protocolPath = 'rendefile://' + absolutePath
    const protocolPath = 'rendefile://' + '/files/' + fileName
    if (!fs.existsSync(newPath)) {
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
    } else {
      return protocolPath
    }
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
  @IpcInvoke('openLocalFile')
  public async openLocalFile(filePath: string) {
    return shell.openPath(filePath)
  }

  @IpcInvoke('captureWebpage')
  public async captureWebpage(webviewId: number) {
    const image = await webContents
      .getAllWebContents()
      .find(i => i.id === webviewId)
      .capturePage()
    return image.toDataURL()
  }

  // @IpcInvoke('detectLang')
  // public async detectLang(text: string) {
  //   const lang = franc(text)
  //   return iso6393To1[lang]
  // }
}
