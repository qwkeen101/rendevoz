import { Background, Font } from '@/consts/colors'
import getSetting from '@/core/setting/getSetting'
export const CanvasOriginFillRect = CanvasRenderingContext2D.prototype.fillRect
export const CanvasOriginFillText = CanvasRenderingContext2D.prototype.fillText
export const CanvasOriginFill = CanvasRenderingContext2D.prototype.fill

const darkMode = {
  fontPrimary: 'white',
  backgroundSecondary: 'black'
}
const darkModeRenderText = (function () {
  const original = CanvasRenderingContext2D.prototype.fillText
  return function () {
    const orig = this['fillStyle']
    this['fillStyle'] = darkMode.fontPrimary
    const res = original.apply(this, arguments)
    this['fillStyle'] = orig
    return res
  }
})()
const darkModeRenderRect = (function () {
  const original = CanvasOriginFillRect
  return function () {
    const orig = this['fillStyle']
    this['fillStyle'] = darkMode.backgroundSecondary
    const res = original.apply(this, arguments)
    this['fillStyle'] = orig
    return res
  }
})()
const darkModeFill = (function () {
  const original = CanvasRenderingContext2D.prototype.fill
  return function () {
    const orig = this['fillStyle']
    this['fillStyle'] = darkMode.backgroundSecondary
    const res = original.apply(this, arguments)
    this['fillStyle'] = orig
    // do something else
    return res
  }
})()
export const renderPageInDarkMode = () => {
  const setting = getSetting()
  const fontPrimary = window.getComputedStyle(document.body).getPropertyValue(Font.Primary)
  const backgroundSecondary = window.getComputedStyle(document.body).getPropertyValue(Background.Secondary)

  if (setting.general.darkMode) {
    darkMode.backgroundSecondary = backgroundSecondary
    darkMode.fontPrimary = fontPrimary
    CanvasRenderingContext2D.prototype.fillText = darkModeRenderText
    CanvasRenderingContext2D.prototype.fillRect = darkModeRenderRect
    CanvasRenderingContext2D.prototype.fill = darkModeFill
  } else {
    CanvasRenderingContext2D.prototype.fillText = CanvasOriginFillText
    CanvasRenderingContext2D.prototype.fillRect = CanvasOriginFillRect
    CanvasRenderingContext2D.prototype.fill = CanvasOriginFill
  }
}

export const renderPageInNormalMode = () => {
  CanvasRenderingContext2D.prototype.fillText = CanvasOriginFillText
  CanvasRenderingContext2D.prototype.fillRect = CanvasOriginFillRect
  CanvasRenderingContext2D.prototype.fill = CanvasOriginFill
}
