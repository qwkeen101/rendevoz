import { useMemo } from 'react'
import tinycolor from 'tinycolor2'
import { getSetting } from '@/core'
import { IWhiteboardNode } from '~/typings'

const useNodeColor = (colorz?: string, type: IWhiteboardNode['type']) => {
  return useMemo(() => {
    const setting = getSetting()

    const isDarkMode = setting.general.darkMode
    const defaultC = isDarkMode ? '#919191' : '#c9c9c9'
    const defaultColor = tinycolor(defaultC)
    const stringDefaultColor = defaultColor.toString('rgb')
    const lightenDefaultColor = defaultColor.lighten(5).toString('rgb')

    const color = colorz ? tinycolor(colorz) : tinycolor(defaultC)
    const stringColor = color.toString('rgb')
    const darkenBackground = color
      .clone()
      .darken(isDarkMode ? 25 : 0)
      .toString('rgb')
    const lightenBackground = color.clone().lighten(15).toString('rgb')
    const opacityBackground = color
      .clone()
      .setAlpha(type === 'group' ? (isDarkMode ? 0.2 : 0.3) : 1)
      .toRgbString()
    return {
      stringColor,
      darkenBackground,
      lightenBackground,
      stringDefaultColor,
      lightenDefaultColor,
      opacityBackground
    }
  }, [colorz])
}

export default useNodeColor
