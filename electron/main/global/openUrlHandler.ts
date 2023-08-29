import { App, BrowserWindow } from 'electron'

export default (app: App, win: BrowserWindow) => {
  app.on('open-url', (event, url) => {
    const lowered = url.toLowerCase()
    if (lowered.startsWith('rendevoz://')) {
      win.webContents.send('openObject', {
        url: lowered
      })
    }
  })
  app.setAsDefaultProtocolClient('rendevoz')
  app.on('second-instance', (event, commandLine) => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
      const url = commandLine.pop().slice()
      const lowered = url.toLowerCase()
      if (lowered.startsWith('rendevoz://')) {
        win.webContents.send('openObject', {
          url: lowered
        })
      }
    }
  })
}
