import callback from './callback'
import { BrowserWindow } from 'electron'
let maxed = false
callback('reload', async () => {
  BrowserWindow.getFocusedWindow().reload()
})

callback('maximizeWindow', async () => {
  if (maxed) {
    BrowserWindow.getFocusedWindow()?.unmaximize()
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
  maxed = false
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
