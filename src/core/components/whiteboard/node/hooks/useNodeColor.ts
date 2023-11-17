import { useMemo } from 'react'
import tinycolor from 'tinycolor2'
import { getSetting } from '@/core'

const useNodeColor = (colorz?: string) => {
  return useMemo(() => {
    const defaultColor = tinycolor('#c9c9c9')
    const stringDefaultColor = defaultColor.toString('rgb')
    const lightenDefaultColor = defaultColor.lighten(5).toString('rgb')
    const color = colorz ? tinycolor(colorz) : tinycolor('#c9c9c9')
    const stringColor = color.toString('rgb')
    const setting = getSetting()
    const isDarkMode = setting.general.darkMode
    const darkenSecondBackground = color
      .clone()
      .darken(isDarkMode ? 30 : 10)
      .setAlpha(0.5)
      .toString('rgb')
    const darkenBackground = color.clone().darken(20).toString('rgb')
    const lightenBackground = color.clone().lighten(15).toString('rgb')
    const opacityBackground = color.clone().setAlpha(0.2).toRgbString()
    return {
      stringColor,
      darkenBackground,
      lightenBackground,
      stringDefaultColor,
      lightenDefaultColor,
      opacityBackground,
      darkenSecondBackground
    }
  }, [colorz])
}

export default useNodeColor
