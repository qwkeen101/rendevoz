import { css } from '@emotion/css'

export const ellipsisFont = (line: number) =>
  css({
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    '-webkit-line-clamp': `${line}`,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-all'
  })

export const defaultFont = () =>
  css({
    fontFamily: 'sans-serif',
    '-webkit-font-smoothing': 'antialiased',
    'font-variant-numeric': 'lining-nums',
    fontFeatureSettings: 'lnum',
    letterSpacing: '-0.04px'
  })
