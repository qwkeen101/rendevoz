import { join, resolve } from 'path'
import { Module } from '@nestjs/common'
import { app, BrowserWindow, protocol, session, shell } from 'electron'
import axios from 'axios'
import { fileURLToPath } from 'url'
import HttpsProxyAgent from 'https-proxy-agent'
import { autoUpdater } from 'electron-updater'
import * as child_process from 'child_process'
import { DEFAULT_USER_DATA_PATH, DefaultRendevozDataPath } from '../app.controller'
import fs from 'fs'
import openUrlHandler from './openUrlHandler'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
process.env.DIST_ELECTRON = join(__dirname, '../..')
process.env.DIST = join(process.env.DIST_ELECTRON, './dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST_ELECTRON, './public')

const slicedLength = 'rendefile://'.length
console.log(process.env.DIST)
@Module({
  providers: [
    {
      provide: 'WEB_CONTENTS',
      async useFactory() {
        const isDev = !app.isPackaged
        const preload = join(__dirname, '../preload/index.js')
        console.log(preload)
        const url = 'http://localhost:7777'
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
        autoUpdater.autoDownload = true
        autoUpdater.autoInstallOnAppQuit = true
        autoUpdater.autoRunAppAfterInstall = false
        let updateAvailable = false
        autoUpdater.setFeedURL({
          provider: 'generic',
          url: 'https://rendevoz.com/download'
        })
        autoUpdater.forceDevUpdateConfig = true
        autoUpdater.on('update-not-available', info => {
          console.log(info)
        })
        autoUpdater.on('update-available', info => {
          updateAvailable = true
          console.log(info)
        })
        autoUpdater.on('update-downloaded', () => {
          if (process.env.USER_CALL_UPDATE === 'true') {
            win.webContents.send('update downloaded')
            setTimeout(() => {
              autoUpdater.quitAndInstall(true, true)
            }, 6000)
          }
        })

        app.setAsDefaultProtocolClient('rendevoz')
        // autoUpdater.autoInstallOnAppQuit = true
        app.on('window-all-closed', () => {
          app.quit()
          search.kill()
          session.defaultSession.clearCache()
          session.defaultSession.clearAuthCache()
          session.defaultSession.clearCodeCaches({ urls: [] })
        })
        app.on('will-quit', () => {
          search.kill()
          session.defaultSession.clearCache()
          session.defaultSession.clearCodeCaches({ urls: [] })
          const os = process.platform
          if (os === 'win32' && updateAvailable) {
            autoUpdater.quitAndInstall(true, false)
          }
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
        app.commandLine.appendSwitch('force-gpu-rasterization')
        app.commandLine.appendSwitch('gpu-rasterization-msaa-sample-count', '0')

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
            console.log(url)
            if (url.includes('printer.html')) return { action: 'allow' }
            if (url.includes('blank')) return { action: 'allow' }
            if (url.includes('index.html')) return { action: 'allow' }
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
            y: 8
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
          webPreferences.preload = absolutePath
        })
        win.webContents.on('did-attach-webview', (_, contents) => {
          contents.setWindowOpenHandler(details => {
            contents.loadURL(details.url)
            return { action: 'deny' }
          })
        })
        const searchCommand =
          process.platform === 'win32'
            ? `${searcheEngineStartPath} --db-path=${searchEngineDataPath}`
            : `cd ${process.env.HOME} && ${searcheEngineStartPath} --db-path=${searchEngineDataPath}`

        const testSearchCmd = searcheEngineStartPath
        const search = child_process.spawn(testSearchCmd, ['--db-path', searchEngineDataPath])

        win.on('close', e => {
          if (process.env.SHOULD_CLOSE === 'false') {
            console.log('prevent close')
            e.preventDefault()
            win.hide()
          }
          win.webContents.send('close')
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
        const wsession = win.webContents.session
        const filter = {
          urls: ['*://*/*']
        }
        wsession.webRequest.onBeforeSendHeaders(filter, (details, cb) => {
          if(details.url.includes('https://pan.baidu.com/rest/2.0/xpan/file?method=streaming')){
            details.requestHeaders['User-Agent'] = 'xpanvideo;netdisk;iPhone13;ios-iphone;15.1;ts'
          }
          if (details.requestHeaders['bili']) {
            const refer = details.requestHeaders['bili']
            details.requestHeaders['Referer'] = refer
          } else {
            if (details.requestHeaders['Referer'] && details.requestHeaders['Referer'].includes('localhost')) {
              const U = new URL(details.url)
              // details.requestHeaders['Referer'] = U.origin
              delete details.requestHeaders['Referer']
            }
          }

          cb({ cancel: false, requestHeaders: details.requestHeaders })
        })
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
        // app.on('browser-window-created', (e, win) => {
        //   win.removeMenu()
        // })

        return win
      },
      inject: ['IS_DEV']
    }
  ],
  exports: ['WEB_CONTENTS']
})
export class WinModule {}
