import Colors from '@/consts/colors'
import FontSize from '@/consts/font'
import { css } from '@emotion/css'

export const ellipsisFont = (line: number) =>
  css({
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: `${line}`,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-all'
  })

export const defaultFont = (fontSize = FontSize['14px'], fontWeight = 400) =>
  css({
    fontFamily: 'OpenSans, Muli, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    fontVariantNumeric: 'lining-nums',
    fontFeatureSettings: 'lnum',
    fontWeight,
    fontSize,
    color: Colors.Font.Primary
  })

export const title = (fontSize = FontSize['16px'], fontWeight = 600, color?: string) => {
  return css({
    fontSize,
    fontWeight,
    color
  })
}

export const animatedBorderBottom = (bottom = 0, left = 0, height = 1, background = 'black') =>
  css({
    position: 'relative',
    transition: 'all 0.3s ease',
    ':after': {
      content: '""',
      position: 'absolute',
      bottom,
      right: 0,
      width: 0,
      height,
      borderRadius: 4,
      borderBottom: `1px solid ${background}`,
      transition: 'width 0.5s'
    },
    ':hover': {
      color: background,
      ':after': {
        width: '100%',
        left,
        right: 'auto'
      }
    }
  })

export const description = (fontSize = FontSize['13px'], fontWeight = 500, color?: string) => {
  return css({
    fontSize,
    fontWeight,
    color: color || Colors.Font.Description
  })
}
export const disableAllTextTransform = css({

})
export const link = () =>
  css({
    cursor: 'pointer'
  })
