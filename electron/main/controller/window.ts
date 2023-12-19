import callback from './callback'
import { BrowserWindow } from 'electron'

callback('reload', async () => {
  BrowserWindow.getFocusedWindow().reload()
})

callback('maximizeWindow', async () => {
  if (BrowserWindow.getFocusedWindow()?.isMaximized()) {
    BrowserWindow.getFocusedWindow()?.unmaximize()
  } else {
    BrowserWindow.getFocusedWindow()?.maximize()
  }
  return
})

callback('minimizeWindow', async () => {
  BrowserWindow.getFocusedWindow()?.minimize()
  return
})

callback('sourceId', async () => {
  return BrowserWindow.getFocusedWindow().getMediaSourceId()
})

callback('close', async () => {
  process.env.SHOULD_CLOSE = 'true'
  // close all windows
  BrowserWindow.getAllWindows().forEach(i => i.close())
})

callback('hide', async () => {
  BrowserWindow.getFocusedWindow().hide()
})

callback('captureWebpage', async (webviewId: number) => {
  if (!webviewId) {
    const image = await BrowserWindow.getFocusedWindow().capturePage()
    return image.toDataURL()
  }
})
