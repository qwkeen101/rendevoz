import { Queue } from 'async-await-queue'
import { getDominantColor } from '@unpic/placeholder'
import tinycolor from 'tinycolor2'

const q = new Queue()
const m = new Map<string, string>()
const canvas = document.createElement('canvas')
function darkenToSameBrightness(color, targetBrightness) {
  const colorObj = tinycolor(color)
  const hsv = colorObj.toHsv()
  return tinycolor({ ...hsv, v: 45 }).toHexString()
}

export default async (ele: HTMLImageElement, url: string): Promise<string> => {
  if (m.has(url)) {
    return m.get(url)!
  }
  await q.wait(url)
  canvas.width = ele.width
  canvas.height = ele.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(ele, 0, 0)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const arr = data.data
  const c = getDominantColor(arr)
  const darken = darkenToSameBrightness(`rgb(${c[0]}, ${c[1]}, ${c[2]})`, 50)
  m.set(url, darken)
  q.end(url)
  return darken
}
