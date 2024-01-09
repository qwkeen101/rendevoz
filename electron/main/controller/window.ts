import callback from './callback'
import { BrowserWindow } from 'electron'
let maxed = false
callback('reload', async () => {
  BrowserWindow.getFocusedWindow().reload()
})

callback('maximizeWindow', async () => {
  if (BrowserWindow.getFocusedWindow()?.isMaximized()) {
    BrowserWindow.getFocusedWindow()?.unmaximize()
    maxed = false
  } else {
    maxed = true
    BrowserWindow.getFocusedWindow()?.maximize()
  }
  return
})
callback('isFullScreen', async () => {
  return maxed
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
  BrowserWindow.getFocusedWindow()?.hide()
})

callback('captureWebpage', async (webviewId: number) => {
  if (!webviewId) {
    const image = await BrowserWindow.getFocusedWindow().capturePage()
    return image.toDataURL()
  }
})
