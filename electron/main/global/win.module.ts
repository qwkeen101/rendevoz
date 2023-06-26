import { join, resolve } from 'path'
import { Module } from '@nestjs/common'
import { BrowserWindow, app, shell, protocol, ipcRenderer, session, ipcMain } from 'electron'
import axios from 'axios'
import { fileURLToPath } from 'url'
import HttpsProxyAgent from 'https-proxy-agent'
import { autoUpdater } from 'electron-updater'
import * as child_process from 'child_process'
import { DEFAULT_USER_DATA_PATH, DefaultRendevozDataPath } from '../app.controller'
import fs from 'fs'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
process.env.DIST_ELECTRON = join(__dirname, '../..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../../dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST_ELECTRON, '../../public')

const slicedLength = 'rendefile://'.length

@Module({
  providers: [
    {
      provide: 'WEB_CONTENTS',
      async useFactory(isDev: boolean) {
        const preload = join(__dirname, '../../preload/index.js')
        const url = process.env.VITE_DEV_SERVER_URL
        const indexHtml = join(process.env.DIST, 'index.html')
        const windowsSearchEngine = join(process.env.PUBLIC, 'meilisearch-windows.exe')
        const macSearchEngine = join(process.env.PUBLIC, 'meilisearch-macos')
        const defaultRendevozDataPath = join(DEFAULT_USER_DATA_PATH, 'rendevoz')
        const searchEngine = process.platform === 'win32' ? windowsSearchEngine : macSearchEngine
        const searchEngineDataPath = join(DEFAULT_USER_DATA_PATH, 'rendevoz', 'data.ms')
        const searcheEngineStartPath = join(DEFAULT_USER_DATA_PATH, 'rendevoz', process.platform === 'win32' ? 'search.exe' : 'search')
        if (!fs.existsSync(defaultRendevozDataPath)) {
          fs.mkdirSync(defaultRendevozDataPath)
        }
        if (!fs.existsSync(searcheEngineStartPath)) {
          fs.copyFileSync(searchEngine, searcheEngineStartPath)
        }
        fs.chmodSync(searcheEngineStartPath, '744')
        autoUpdater.autoDownload = false
        autoUpdater.autoInstallOnAppQuit = false
        autoUpdater.autoRunAppAfterInstall = false
        autoUpdater.setFeedURL({
          provider: 'generic',
          url: 'https://rendevoz.com/download'
        })
        autoUpdater.forceDevUpdateConfig = true
        autoUpdater.on('update-not-available', info => {
          console.log(info)
        })
        autoUpdater.on('update-available', info => {
          console.log(info)
        })
        autoUpdater.on('update-downloaded', () => {
          ipcRenderer.send('update downloaded')
          setTimeout(() => {
            autoUpdater.quitAndInstall()
          }, 6000)
        })
        autoUpdater.on('download-progress', e => {
          win.webContents.send('download', e)
        })
        app.on('window-all-closed', () => {
          app.quit()
          search.kill()
          session.defaultSession.clearCache()
          session.defaultSession.clearAuthCache()
          session.defaultSession.clearCodeCaches({ urls: [] })
        })
        app.on('will-quit', () => {
          session.defaultSession.clearCache()
          session.defaultSession.clearCodeCaches({ urls: [] })
        })
        app.setAsDefaultProtocolClient('rendevoz')
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
        app.commandLine.appendSwitch('force-gpu-rasterization')
        app.commandLine.appendSwitch('gpu-rasterization-msaa-sample-count', '0')

        protocol.registerSchemesAsPrivileged([
          {
            scheme: 'rendefile',
            privileges: {
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
            console.log(url)
            if (url.startsWith('https://rendevoz.firebaseapp.com/')) {
              return { action: 'allow' }
            }
            shell.openExternal(url)
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
            x: 10,
            y: 10
          }
        })

        win.webContents.on('will-attach-webview', (e, webPreferences) => {
          const prePath = process.env.PUBLIC + '/webpre.js'
          const absolutePath = resolve(prePath)
          webPreferences.preload = absolutePath
        })
        win.webContents.on('did-attach-webview', (_, contents) => {
          contents.setWindowOpenHandler(details => {
            contents.loadURL(details.url)
            return { action: 'deny' }
          })
        })
        const search = child_process.exec(
          `cd ${process.env.HOME} && ${searcheEngineStartPath} --db-path=${searchEngineDataPath}`,
          (err, rr, r) => {
            win.webContents.send('search', {
              err,
              rr,
              r
            })
          }
        )

        win.on('close', e => {
          console.log(process.env.SHOULD_CLOSE)
          if (process.env.SHOULD_CLOSE === 'false') {
            console.log('prevent close')
            e.preventDefault()
            win.hide()
          }
          win.webContents.send('close')
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
        const wsession = win.webContents.session

        // 下面的代码会尝试解析代理配置，如果用户配置了系统代理，
        // 并且代理规则没有排除 www.google.com，那我们就可以读取到代理信息
        wsession.resolveProxy('https://www.google.com').then(proxyUrl => {
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
          // win.webContents.openDevTools()
        }

        win.on('closed', () => {
          console.log('closed')
          win.destroy()
        })

        return win
      },
      inject: ['IS_DEV']
    }
  ],
  exports: ['WEB_CONTENTS']
})
export class WinModule {}
