import Colors, { Background } from '@/consts/colors'
import { css } from '@emotion/css'

export const circleButton = (padding = 5, borderRadius = 999) =>
  css({
    transition: 'all 0.2s ease',
    padding,
    cursor: 'pointer',
    borderRadius,
    ':hover': {
      background: `${Colors.Background.ButtonHover} !important`
    }
  })

export const flatButton = (borderRadius = 4, padding = '4px 8px', background = Colors.Background.ButtonHover) => {
  const bgRgba =
    background === Colors.Background.ButtonHover
      ? getComputedStyle(document.body)
          .getPropertyValue(Background.ButtonHover)
          .match(/[.?\d]+/g)
      : background.match(/[.?\d]+/g)

  return css({
    transition: 'all 0.2s ease',
    borderRadius,
    padding,
    cursor: 'pointer',
    userSelect: 'none',
    ':hover': {
      background: `${background} !important`
    },
    ':active': {
      background: `rgba(${bgRgba?.[0]},${bgRgba?.[1]},${bgRgba?.[2]},0.1) !important`
    }
  })
}
