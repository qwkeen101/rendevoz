import { App, BrowserWindow } from 'electron'

export default (app: App, win: BrowserWindow) => {
  let cachedRequests: string[] = []
  let loaded = false
  const handleRequest = () => {
    if (loaded) {
      cachedRequests.forEach(request => {
        win.webContents.send('openObject', {
          url: request
        })
      })
      cachedRequests = []
    }
  }
  win.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      loaded = true
      handleRequest()
    }, 5000)
  })
  app.on('open-url', (event, url) => {
    const lowered = url.toLowerCase()
    if (lowered.startsWith('rendevoz://')) {
      cachedRequests.push(lowered)
      handleRequest()
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
        cachedRequests.push(lowered)
        handleRequest()
      }
    }
  })
}
