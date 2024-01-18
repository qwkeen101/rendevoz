import { join, resolve } from 'path'
import fs from 'fs'
import { autoUpdater } from 'electron-updater'
import { fileURLToPath } from 'url'
import openUrlHandler from '../global/openUrlHandler'
import requestIntercepter from '../global/requestIntercepter'
import HttpsProxyAgent from 'https-proxy-agent'
import axios from 'axios'
import { app, BrowserWindow, protocol, session, shell, Menu, Tray, nativeImage } from 'electron'
import path from 'path'
import '../controller/app'
import '../controller/file'
import '../controller/window'
import '../controller/baidu'
import '../controller/plugin'
import '../controller/pdf'

export const DEFAULT_USER_DATA_PATH =
  process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share')

export const DefaultRendevozDataPath = path.join(DEFAULT_USER_DATA_PATH, 'rendevoz')
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
process.env.DIST_ELECTRON = join(__dirname, '../..')
process.env.DIST = join(process.env.DIST_ELECTRON, './dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST_ELECTRON, './public')
const slicedLength = 'rendefile://'.length

const startElectron = async () => {
  const isDev = !app.isPackaged
  const preload = join(__dirname, '../preload/index.js')
  const url = 'http://localhost:7777'
  const indexHtml = join(process.env.DIST, 'index.html')
  const defaultRendevozDataPath = join(DEFAULT_USER_DATA_PATH, 'rendevoz')
  if (!fs.existsSync(defaultRendevozDataPath)) {
    fs.mkdirSync(defaultRendevozDataPath)
  }
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.autoRunAppAfterInstall = true
  let updateAvailable = false
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://rendevoz.com/download'
  })
  autoUpdater.forceDevUpdateConfig = true

  autoUpdater.on('update-available', info => {
    updateAvailable = true
    win.webContents.send('updateAvailable')
    console.log(info)
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
    session.defaultSession.clearCache()
    session.defaultSession.clearAuthCache()
    session.defaultSession.clearCodeCaches({ urls: [] })
  })
  app.on('will-quit', () => {
    session.defaultSession.clearCache()
    session.defaultSession.clearCodeCaches({ urls: [] })
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
    console.log(process.env.FILE_PATH)
    const FILE_PATH = process.env.FILE_PATH || DefaultRendevozDataPath
    const filePath = fileURLToPath('file://' + FILE_PATH + req.url.replace(FILE_PATH, '').slice(slicedLength))
    callback(filePath)
  })

  app.on('web-contents-created', (createEvent, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      if (url.includes('printer.html')) return { action: 'allow' }
      if (url.includes('blank')) return { action: 'allow' }
      if (url.includes('index.html')) return { action: 'allow' }
      if (url.startsWith('https://rendevoz.firebaseapp.com/')) {
        return { action: 'allow' }
      }
      if (url.startsWith('rendefile://')) {
        const FILE_PATH = process.env.FILE_PATH || DefaultRendevozDataPath
        const u = FILE_PATH + url.replace(FILE_PATH, '').slice(slicedLength)
        console.log(u)
        shell.openExternal('file://' + u)
      } else {
        shell.openExternal(url)
      }
      // win.webContents.send('newPage', url)
      return { action: 'deny' }
    })
  })
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
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

  openUrlHandler(app, win)

  autoUpdater.on('download-progress', e => {
    win.webContents.send('download', e)
  })
  win.webContents.on('will-attach-webview', (e, webPreferences, params) => {
    const prePath = process.env.PUBLIC + '/webpre.js'
    const videoPrePath = process.env.PUBLIC + '/videopre.js'
    const absolutePath = resolve(prePath)
    const videoAboPath = resolve(videoPrePath)
    if (params.webpreferences.includes('video')) {
      console.log(videoAboPath)
      webPreferences.preload = videoAboPath
      return
    }
    // webPreferences.preload = absolutePath
  })
  win.webContents.on('did-attach-webview', (_, contents) => {
    contents.setWindowOpenHandler(details => {
      console.log(details)
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

  // 下面的代码会尝试解析代理配置，如果用户配置了系统代理，
  // 并且代理规则没有排除 www.google.com，那我们就可以读取到代理信息
  win.webContents.session.resolveProxy('https://www.google.com').then(proxyUrl => {
    // DIRECT 表示没有配置代理
    if (proxyUrl !== 'DIRECT') {
      // proxyUrl 是这种格式: 'PROXY 127.0.0.1:6152'
      const hostAndPort = proxyUrl.split(' ')[1]
      const [proxyHost, proxyPort] = hostAndPort.split(':')

      // 到这里就拿到代理服务器的信息了，这里我用 https-proxy-agent 这个 npm 包让 Axios 的默认请求强制走系统代理
      // @ts-ignore
      const agent = new HttpsProxyAgent({
        host: proxyHost,
        port: proxyPort
      })
      axios.defaults.httpsAgent = agent
    }
  })
  if (app.isPackaged) {
    win.loadFile(indexHtml)
  } else {
    win.loadURL(url)
  }

  win.on('closed', () => {
    win.destroy()
  })
}

const base64AppIcon =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAACYktHRAD/h4/MvwAAAAd0SU1FB+gBEgo7NZYlKyYAAANhSURBVGje7ZlPSBVBHMc/q2b+QRRLCiPBgiRNkIpIoYTAyoLMgx0irKCggjpGUNC5Y4eCsMKDUNa5SwVlaWhlQZJ6KS0iLUhfVv5JfdNh9718O7vPmXnP9eJvTjM7M9/Pzp/f/HYWlmzJFtmsOM+WsZNSchAIAAQQBgSCsFMinHIRzY8zxAcGmU4UbTNdCMP0mx6uUctyc/nVfHE6C3skVZD3nCXTDOCij7ROsiG62WEC8DAJABGICU74C6X4lKeZz16MCQQZNHFKF6ArSQA2BFxnt16jYkK+S9BsKgbJ9xJK9QEI0U0l+ViGSbY84LFcHM8R5bKPcrKiAykII5h1VnfE+di9REQFGZSwnfyY53adUcoYSuLUxrE1XGZSmkDBuWDkbathzIUgeBIkABxzLWPBGGuDRXjjAhDUuqukmPSrbA9icgIoDRagG/c+CxhgXCqRzsaFBajE7Q2+BgmQSUNM3gL6FvSFXdYgbcMwW4OTT+WV5IgGyA5KfiUtHq74tlxRNfDIJIswArBIIcXZXJGumfMkmyJqaKTY1YMFtModW8xnG9lPNRvIYdZZ0W4A4cjjAOQB7tUPFi+pYlZvIAtoYsIgLPeODWv1xKGEvqRFRYKbuvJ59CYtJBN0kqMLcCWJgflrCnXlCxhJ2qfJPVboysPhhGffFu+nMb6Qnx+oRg4q9WyGTpq5z5gZwHqpZJhJUhHR6DeCNxdTIJjlB/285SnvVDj9AGLPbYtp6ukhbV4ACDOhM1B+APKAh/ij07Gq+cUDlpRPXwh59YBESL49YAAWH2CBTP0iQscPbKGBQnq5wydTsBeuaO4vm5TbXmDS8YPfOW4K0OECmKJMsWXNHCcuEJyOX91vDZgvuTNzWtuXMydNAEwtmwrpRW5wNBkAamMyw5TUzuKW6xPFAMBSrDnFIw/0VFqoU35VANqNd0ER3zwiCcE4exIZAXU/8JlD/JRqCzJppVwdQJ5xdUfURh2jHgi5XEoEIKwMAG0cIOSBvE2OjdVPQx0AaOegx0Skq19QuO82JghpAdijMOZCGGRUFaDdle9hWBMAnlHPr+gdqgXcVf+R8/+PiZ32asvbtouP0T6aydBpWsFzp+EARwzlAVZxnhau+n2axttcFlWsI0QHIwkALNmSzWP/AC0CviZUxM+xAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDI0LTAxLTE4VDEwOjU5OjUyKzAwOjAwvFhYFQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyNC0wMS0xOFQxMDo1OTo1MiswMDowMM0F4KkAAAAodEVYdGRhdGU6dGltZXN0YW1wADIwMjQtMDEtMThUMTA6NTk6NTMrMDA6MDA8Z8rCAAAAAElFTkSuQmCC'
export default startElectron
