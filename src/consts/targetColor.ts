import { getSetting } from '@/core'
import tinycolor from 'tinycolor2'

export const getColor = (currentColor: string) => {
  const mode = getSetting().general.darkMode
  if (mode) {
    return tinycolor(currentColor).darken(50).toRgbString()
  }
  return currentColor
}
