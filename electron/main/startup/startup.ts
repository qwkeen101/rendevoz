import { join, resolve } from 'path'
import fs from 'fs'
import { autoUpdater } from 'electron-updater'
import { fileURLToPath } from 'url'
import openUrlHandler from '../global/openUrlHandler'
import requestIntercepter from '../global/requestIntercepter'
import { app, BrowserWindow, protocol, shell, Menu, Tray, nativeImage } from 'electron'
import '../controller/app'
import '../controller/file'
import '../controller/window'
import '../controller/baidu'
import '../controller/plugin'
import '../controller/webpage'
import '../controller/pdf'
import '../controller/rag'

import restoreWindowSize from './restoreWindowSize'
import replaceFilePosition from './replaceFilePosition'
import { DefaultRendevozDataPath } from '../service/file'
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
process.env.DIST_ELECTRON = join(__dirname, '../..')
process.env.DIST = join(process.env.DIST_ELECTRON, './dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST_ELECTRON, './public')
const slicedLength = 'rendefile://'.length
export let globalWindow: BrowserWindow | undefined = undefined
const startElectron = async () => {
  const isDev = !app.isPackaged
  const preload = join(__dirname, '../preload/index.js')
  const url = 'http://localhost:7777'
  const indexHtml = join(process.env.DIST, 'index.html')
  const defaultRendevozDataPath = DefaultRendevozDataPath
  if (!fs.existsSync(defaultRendevozDataPath)) {
    fs.mkdirSync(defaultRendevozDataPath)
  }
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.autoRunAppAfterInstall = true

  // The update feed comes from app-update.yml, which electron-builder writes
  // from the "publish" block in electron-builder.json5. The old hard-coded
  // feed (https://rendevoz.com/download) belonged to the original author and
  // is offline; whoever controls that domain could push installers to users.
  autoUpdater.on('update-available', info => {
    win.webContents.send('updateAvailable')
  })
  autoUpdater.on('update-downloaded', () => {
    win.webContents.send('updateDownloaded')
    process.env.IS_DOWNLOADING = 'false'
  })
  autoUpdater.on('error', () => {
    process.env.IS_DOWNLOADING = 'false'
  })
  app.setAsDefaultProtocolClient('rendevoz')
  // autoUpdater.autoInstallOnAppQuit = true
  app.on('window-all-closed', () => {
    app.quit()
  })

  if (isDev) {
    if (process.platform === 'win32') {
      process.on('message', data => {
        if (data === 'graceful-exit') app.quit()
      })
    } else {
      process.on('SIGTERM', () => {
        app.quit()
      })
    }
  }
  app.commandLine.appendSwitch('disable-site-isolation-trials')
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'rendefile',
      privileges: {
        stream: true,
        supportFetchAPI: true
      }
    }
  ])
  await app.whenReady()

  protocol.registerFileProtocol('rendefile', (req, callback) => {
    const FILE_PATH = process.env.FILE_PATH || DefaultRendevozDataPath
    const filePath = fileURLToPath('file://' + FILE_PATH + req.url.replace(FILE_PATH, '').slice(slicedLength))
    callback(filePath)
  })

  app.on('web-contents-created', (createEvent, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      if (url.includes('printer.html')) return { action: 'allow' }
      if (url.includes('blank')) return { action: 'allow' }
      if (url.startsWith('https://rendevoz.firebaseapp.com/')) {
        return { action: 'allow' }
      }
      if (url.startsWith('rendefile://')) {
        const FILE_PATH = process.env.FILE_PATH || DefaultRendevozDataPath
        const u = FILE_PATH + url.replace(FILE_PATH, '').slice(slicedLength)
        shell.openExternal('file://' + u)
      } else {
        shell.openExternal(url)
      }
      return { action: 'deny' }
    })
  })
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    backgroundColor: '#191919',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload,
      devTools: true,
      webSecurity: false,
      webviewTag: true
    },
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    trafficLightPosition: {
      x: 16,
      y: 12
    }
  })
  globalWindow = win
  try {
    restoreWindowSize(win, app)
    openUrlHandler(app, win)
    replaceFilePosition(app)
  } catch (e) {
    console.log(e)
  }
  autoUpdater.on('download-progress', e => {
    win.webContents.send('download', e)
  })
  win.webContents.on('will-attach-webview', (e, webPreferences, params) => {
    const videoPrePath = process.env.PUBLIC + '/videopre.js'
    const videoAboPath = resolve(videoPrePath)
    if (params.webpreferences.includes('video')) {
      webPreferences.preload = videoAboPath
      webPreferences.webSecurity = false
      return
    }
  })
  win.webContents.on('did-attach-webview', (_, contents) => {
    contents.setWindowOpenHandler(details => {
      contents.loadURL(details.url)
      return { action: 'deny' }
    })
  })
  process.env.SHOULD_CLOSE = 'false'
  let tray = null
  function createTray() {
    const appIcon = new Tray(nativeImage.createFromPath(join(process.env.PUBLIC, 'icon.png')))
    const lang = app.getLocale()
    const contextMenu = Menu.buildFromTemplate([
      {
        label: lang === 'zh-CN' ? '显示' : 'Show',
        click: () => {
          win.show()
        }
      },
      {
        label: lang === 'zh-CN' ? '退出' : 'Exit',
        click: () => {
          process.env.MINIMIZE_TO_TRAY = 'false'
          win.close()
        }
      }
    ])
    appIcon.on('click', () => {
      win.show()
    })
    appIcon.setContextMenu(contextMenu)
    return appIcon
  }

  win.on('close', e => {
    if (process.env.MINIMIZE_TO_TRAY === 'true' && process.platform === 'win32') {
      e.preventDefault()
      win.hide()
      if (!tray) {
        tray = createTray()
      }
      return
    }
    if (process.env.SHOULD_CLOSE === 'false') {
      win.webContents.send('unload')
      e.preventDefault()
      win.hide()
      // 10s timeout, for renderer crash
      setTimeout(() => {
        process.env.SHOULD_CLOSE = 'true'
        win.close()
      }, 10000)
    }
  })
  win.on('enter-full-screen', () => {
    win.webContents.send('fullScreen')
  })
  win.on('leave-full-screen', () => {
    win.webContents.send('leaveFullScreen')
  })
  win.on('maximize', () => {
    win.webContents.send('winMaximized')
  })
  win.on('unmaximize', () => {
    win.webContents.send('winUnmaximized')
  })

  win.webContents.session.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (d, c) => {
    if (d.responseHeaders['X-Frame-Options']) {
      delete d.responseHeaders['X-Frame-Options']
    } else if (d.responseHeaders['x-frame-options']) {
      delete d.responseHeaders['x-frame-options']
    }
    delete d.responseHeaders['Content-Security-Policy']
    c({ cancel: false, responseHeaders: d.responseHeaders })
  })
  requestIntercepter(win)
  if (app.isPackaged) {
    win.loadFile(indexHtml)
  } else {
    win.loadURL(url)
  }

  win.on('closed', () => {
    win.destroy()
  })
}

export default startElectron
