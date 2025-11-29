import * as Electron from 'electron'
import globalShortcut = Electron.globalShortcut

export default (app: Electron.App) => {
  app.on('ready', () => {
    app.on('browser-window-focus', () => {
      globalShortcut.registerAll(['CommandOrControl+W', 'CommandOrControl+M', 'CommandOrControl+R'], () => {
        return
      })
    })
    app.on('browser-window-blur', () => {
      globalShortcut.unregisterAll()
    })
  })
}
