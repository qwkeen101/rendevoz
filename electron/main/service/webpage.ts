import { BrowserWindow, WebContentsView } from 'electron'
import OnBeforeRequestListenerDetails = Electron.OnBeforeRequestListenerDetails
import { globalWindow } from '../startup/startup'

type ResourceType = OnBeforeRequestListenerDetails['resourceType']

type IMSNNewsDetails = {
  abstract: string
  title: string
  sourceHref: string
  body: string
  imageResources: {
    url: string
    title: string
    caption: string
  }[]
}

const createWindow = (): BrowserWindow => {
  return globalWindow
}

const interceptBadRequests = (view: WebContentsView) => {
  view.webContents.setAudioMuted(true)
  view.setVisible(false)
  // all views use same session
  view.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    if (details.webContentsId === view.webContents.id) {
      if ((['stylesheet', 'font', 'image', 'media', 'webSocket', 'cspReport', 'ping'] as ResourceType[]).includes(details.resourceType)) {
        callback({ cancel: true })
      } else {
        callback({})
      }
      return
    }
    callback({})
  })
}
const loadMSNContent = async (url: string) => {
  const id = url.match(/\/ar-([A-Za-z0-9]+)/)?.[1]
  const region = url.match(/msn\.(?:com|cn)\/([a-z]{2}-[a-z]{2})\//i)?.[1]
  if (id && region) {
    const res = (await fetch(`https://assets.msn.com/content/view/v2/Detail/${region}/${id}`).then(i => i.json())) as IMSNNewsDetails
    let html = res.body
    if (res.imageResources?.length) {
      html = `<img src=${res.imageResources[0].url}></img>${html}`
    }
    return html
  }
}

export const loadWebpageContent = async (url: string) => {
  const msnContent = await loadMSNContent(url)
  if (msnContent) return `<html><body>${msnContent}</body></html>`
  const win = createWindow()
  const view = new WebContentsView({
    webPreferences: {
      offscreen: true
    }
  })
  interceptBadRequests(view)
  const now = Date.now()
  win.contentView.addChildView(view)
  view.webContents.loadURL(url)
  try {
    const getText = async () => {
      const text = await view.webContents.executeJavaScript('document.body.innerText')
      if (text) {
        return true
      }
      return false
    }
    while (!(await getText())) {
      // 10s timeout
      if (Date.now() - now > 10 * 1000) {
        win.contentView.removeChildView(view)
        return Promise.reject()
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    const html = await view.webContents.executeJavaScript('document.documentElement.outerHTML')
    return html
  } finally {
    win.contentView.removeChildView(view)
  }
}

export const getGnewsRedirect = async (url: string) => {
  const win = createWindow()
  const view = new WebContentsView({
    webPreferences: {
      offscreen: true
    }
  })
  interceptBadRequests(view)
  const now = Date.now()
  win.contentView.addChildView(view)
  view.webContents.loadURL(url)
  view.webContents.setAudioMuted(true)
  view.setVisible(false)
  const isURLGoogle = () => {
    const url = view.webContents.getURL()
    if (url.includes('news.google.com') || !url) {
      return true
    }
    return false
  }
  try {
    while (isURLGoogle()) {
      // 10s timeout
      if (Date.now() - now > 10 * 1000) {
        win.contentView.removeChildView(view)
        return Promise.reject()
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    const finalURL = view.webContents.getURL()
    console.log(finalURL)
    return finalURL
  } finally {
    win.contentView.removeChildView(view)
  }
}
