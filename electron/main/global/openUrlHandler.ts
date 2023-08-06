import { App, BrowserWindow } from 'electron'

export default (app: App, win: BrowserWindow) => {
  app.on('open-url', (event, url) => {
    const lowered = url.toLowerCase()
    if (lowered.startsWith('rendevoz://object')) {
      const newUrl = lowered.replace('rendevoz://object/', '')
      if (newUrl.length) {
        const metaId = Number(newUrl)
        console.log(metaId)
        win.webContents.send('openObject', {
          metaId
        })
      }
    }
  })
  app.setAsDefaultProtocolClient('rendevoz')
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
      const url = commandLine.pop().slice()
      const lowered = url.toLowerCase()
      if (lowered.startsWith('rendevoz://object')) {
        const newUrl = lowered.replace('rendevoz://object/', '')
        if (newUrl.length) {
          const metaId = Number(newUrl)
          win.webContents.send('openObject', {
            metaId
          })
        }
      }
    }
  })
}
