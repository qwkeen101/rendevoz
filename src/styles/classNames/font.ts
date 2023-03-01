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

export const defaultFont = (fontSize = 13, fontWeight = 400) =>
  css({
    fontFamily: 'Muli, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    fontVariantNumeric: 'lining-nums',
    fontFeatureSettings: 'lnum',
    letterSpacing: '-0.04px',
    fontWeight,
    fontSize
  })

export const title = (fontSize = '1.2rem', fontWeight = 600, color?: string) => {
  return css({
    fontSize,
    fontWeight,
    color: color || '#121212'
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

export const description = (fontSize = '0.8rem', fontWeight = 500, color?: string) => {
  return css({
    fontSize,
    fontWeight,
    color: color || '#37352f80'
  })
}

export const link = () =>
  css({
    cursor: 'pointer'
  })
