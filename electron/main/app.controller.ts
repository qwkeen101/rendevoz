import { Controller, Inject } from '@nestjs/common'
import { BrowserWindow, dialog, shell, webContents } from 'electron'
import { AppService } from './app.service'
import { IpcInvoke } from './transport'
import fs from 'fs'
import path from 'path'
import { autoUpdater } from 'electron-updater'
import { digestBuffer } from './utils'
import fetch from 'node-fetch'

export const DEFAULT_USER_DATA_PATH =
  process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share')

export const DefaultRendevozDataPath = path.join(DEFAULT_USER_DATA_PATH, 'rendevoz')

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, @Inject('WEB_CONTENTS') private readonly win: BrowserWindow) {}
  private DefaultRendevozDataPath = path.join(DEFAULT_USER_DATA_PATH, 'rendevoz')
  private webContents = this.win.webContents

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

  @IpcInvoke('saveImage')
  public async saveImage(imgName: string, imgData: string) {
    this.checkIfRendevozGenerated()
    const imgPath = path.join(process.env.FILE_PATH || this.DefaultRendevozDataPath, 'imgs')
    if (!fs.existsSync(imgPath)) {
      fs.mkdirSync(imgPath, {})
    }
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

  @IpcInvoke('saveFile')
  public async saveFile(filePath: string, fileName: string) {
    this.checkIfRendevozGenerated()
    const rendevozFilePath = path.join(process.env.FILE_PATH || this.DefaultRendevozDataPath, 'files')
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
    const result = await autoUpdater.checkForUpdatesAndNotify()
    return result.updateInfo
  }

  @IpcInvoke('saveBuffer')
  public async saveBuffer(
    buffer: Buffer | ArrayBuffer,
    fileName: string,
    filePath?: string,
    fileSavePath: 'files' | 'imgs' | 'backup' = 'files'
  ) {
    this.checkIfRendevozGenerated()
    const rendevozFilePath = path.join(process.env.FILE_PATH || this.DefaultRendevozDataPath, fileSavePath)
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
    console.log(newPath, protocolPath)
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

  @IpcInvoke('updateAndInstall')
  public async updateAndInstall() {
    try {
      process.env.USER_CALL_UPDATE = 'true'
      const result = await autoUpdater.downloadUpdate()
      return result
    } catch (e) {
      autoUpdater.quitAndInstall(true, true)
    }
  }

  private checkIfRendevozGenerated = () => {
    const customUserFilePath = process.env.FILE_PATH
    const rendevozFilePath = customUserFilePath || this.DefaultRendevozDataPath
    const filePath = path.join(rendevozFilePath, 'files')
    const imgPath = path.join(rendevozFilePath, 'imgs')
    const backupPath = path.join(rendevozFilePath, 'backup')
    if (!fs.existsSync(rendevozFilePath)) {
      fs.mkdirSync(rendevozFilePath, {})
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

  @IpcInvoke('openLocalFile')
  public async openLocalFile(filePath: string) {
    return shell.openPath(filePath)
  }

  @IpcInvoke('captureWebpage')
  public async captureWebpage(webviewId?: number, rect?: Electron.Rectangle) {
    if (!webviewId) {
      const image = await BrowserWindow.getFocusedWindow().capturePage()
      return image.toDataURL()
    }
    const image = await webContents
      .getAllWebContents()
      .find(i => i.id === webviewId)
      .capturePage()
    return image.toDataURL()
  }

  @IpcInvoke('printPDF')
  public async printPDF(
    options: { name?: string; size?: string; margin?: 'default' | 'none'; horizontal?: boolean } = {
      name: 'Untitled',
      size: 'A4',
      margin: 'default',
      horizontal: false
    }
  ) {
    console.log('printing')
    const pdf = await webContents
      .getAllWebContents()
      .find(i => i.getTitle().includes('PDF'))
      .printToPDF?.({
        printBackground: true,
        pageSize: options.size,
        landscape: options.horizontal,
        margins: {
          marginType: options.margin
        }
      })

    const pos = await dialog.showSaveDialog({
      defaultPath: `${options.name}.pdf`,
      title: 'Save PDF'
    })
    if (pos.filePath) {
      await new Promise(res => {
        fs.writeFile(pos.filePath, pdf, {}, () => {
          res(true)
        })
      })
      return 'OK'
    }
    return 'Cancel'
  }
  @IpcInvoke('getUserFilePath')
  public async getUserFilePath() {
    return this.DefaultRendevozDataPath
  }

  @IpcInvoke('getSelectedFolderPath')
  public async getSelectedFolderPath() {
    const path = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    })
    return path.filePaths[0]
  }

  @IpcInvoke('close')
  public async close() {
    this.win.close()
  }
  @IpcInvoke('beginBackup')
  public async beginBackup() {
    console.log('shouldBackup')
    process.env.SHOULD_CLOSE = false
  }

  @IpcInvoke('endBackup')
  public async endBackup() {
    process.env.SHOULD_CLOSE = true
  }

  @IpcInvoke('changeFilePath')
  public async changeFilePath(newPath: string) {
    const targetFilesPath = path.join(newPath, 'files')
    const targetImgsPath = path.join(newPath, 'imgs')
    const targetBackupPath = path.join(newPath, 'backup')
    if (!fs.existsSync(targetFilesPath)) {
      fs.rename(path.join(process.env.FILE_PATH || this.DefaultRendevozDataPath, 'files'), path.join(newPath, 'files'), () => {})
    }
    if (!fs.existsSync(targetImgsPath)) {
      fs.rename(path.join(process.env.FILE_PATH || this.DefaultRendevozDataPath, 'imgs'), path.join(newPath, 'imgs'), () => {})
    }
    if (!fs.existsSync(targetBackupPath)) {
      fs.rename(path.join(process.env.FILE_PATH || this.DefaultRendevozDataPath, 'backup'), path.join(newPath, 'backup'), () => {})
    }
    process.env.FILE_PATH = newPath
  }

  @IpcInvoke('installPlugins')
  public async installPlugins(pluginPath: string) {
    console.log(pluginPath)
    if (fs.existsSync(pluginPath)) {
      const allPluginsFolders = fs.readdirSync(pluginPath)
      const installablePluginsPaths = allPluginsFolders
        .map(i => {
          console.log(i)
          try {
            const fileNames = fs.readdirSync(`${pluginPath}/${i}`)
            if (fileNames.includes('manifest.json') && fileNames.includes('main.js')) {
              const manifest = fs.readFileSync(`${pluginPath}/${i}/manifest.json`, 'utf-8')
              const parsedManifest = JSON.parse(manifest)
              return {
                name: parsedManifest.name,
                version: parsedManifest.version,
                author: parsedManifest.author,
                entry: `${pluginPath}/${i}/main.js`
              }
            }
          } catch (e) {
            console.log(e)
          }
        })
        .filter(i => i)
      console.log(allPluginsFolders, installablePluginsPaths)
      return installablePluginsPaths
    }
  }

  @IpcInvoke('openDatabaseFolder')
  public async openDatabaseFolder() {
    const databasePath = path.join(process.env.FILE_PATH || this.DefaultRendevozDataPath, 'backup')
    if (!fs.existsSync(databasePath)) {
      fs.mkdirSync(databasePath)
    }
    shell.showItemInFolder(databasePath)
  }

  @IpcInvoke('deleteRendefile')
  public async deleteRendefile(url: string) {
    const databasePath = path.resolve(process.env.FILE_PATH || this.DefaultRendevozDataPath)
    const replacedPath = url.replace('rendefile://', databasePath)
    fs.rmSync(replacedPath)
  }

  @IpcInvoke('getBaidudiskFiles')
  public async getBaidudiskFiles(accessToken: string) {
    const result = await fetch(
      `https://pan.baidu.com/rest/2.0/xpan/multimedia?method=listall&access_token=${accessToken}&path=/&recursion=1&web=1`,
      {
        method: 'get',
        headers: {
          Referer: '',
          'User-Agent': 'pan.baidu.com'
        }
      }
    )
    const j = await result.json()
    return j
  }

  @IpcInvoke('loginBaidudisk')
  public async loginBaidudisk(code: string) {
    const url = `https://openapi.baidu.com/oauth/2.0/token?
grant_type=authorization_code&
code=${code}&
client_id=PVYWIzaqR20Cv3ukyubu9YofKMSrqmLC&
client_secret=Za8BXRX1N9ONG4drbWNeg6yhKXL7x8KF&
redirect_uri=rendevoz://baidudisk`
    const result = await (await fetch(url)).json()
    return result
  }
}
