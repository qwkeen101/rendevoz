import { css } from '@emotion/css'

export const circleButton = (padding = 5, borderRadius = 999) =>
  css({
    transition: 'all 0.2s ease',
    padding,
    cursor: 'pointer',
    borderRadius,
    ':hover': {
      background: 'rgba(31, 34, 37, 0.06)'
    }
  })

export const flatButton = (borderRadius = 4, padding = '4px 8px') =>
  css({
    transition: 'all 0.2s ease',
    borderRadius,
    padding,
    cursor: 'pointer',
    ':hover': {
      background: 'rgba(31, 34, 37, 0.06)'
    }
  })
