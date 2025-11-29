import { BrowserWindow, app } from 'electron'
import pie from 'puppeteer-in-electron'
import puppeteer from 'puppeteer-core'

export default async () => {
  console.log('start       asdsaddddddddddddddddddddddd')
  await pie.initialize(app)
  const browser = await pie.connect(app, puppeteer)

  const window = new BrowserWindow()
  window.hide()
  const url = 'https://www.36kr.com/p/2871336142147714'
  await window.loadURL(url)

  const page = await pie.getPage(browser, window)
  const content = await page.content()
  console.log(content)
  window.destroy()
}
