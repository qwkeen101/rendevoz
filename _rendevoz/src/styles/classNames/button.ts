import Colors from '@/consts/colors'
import { css } from '@emotion/css'

export const circleButton = (padding = 4, borderRadius = 999) => {
  return css({
    transition: 'all 0.2s ease',
    padding,
    cursor: 'pointer',
    borderRadius,
    '&[data-active="true"]': {
      background: `${Colors.Background.ButtonHover}`
    },
    ':hover': {
      background: `${Colors.Background.ButtonHover}`
    },
    ':active': {
      background: `${Colors.Background.ButtonActive}`
    }
  })
}

export const selectButton = (borderRadius = 4, padding = '3px 8px') => {
  return css({
    transition: 'all 0.2s ease',
    borderRadius,
    padding,
    cursor: 'pointer',
    userSelect: 'none',
    flexShrink: 0,
    background: 'rgb(35, 131, 226)',
    color: 'white',
    boxShadow: 'inset 0 0 0 1px var(--border-background)',
    '&[data-active="true"]': {
      background: `rgb(0,107,199)`
    },
    ':hover': {
      background: `rgb(0,119,212)`
    },
    ':active': {
      background: `rgb(0,107,199)`
    }
  })
}
export const flatButton = (borderRadius = 4, padding = '3px 8px', background = Colors.Background.ButtonHover, border = false) => {
  return css({
    transition: 'all 0.2s ease',
    borderRadius,
    padding,
    cursor: 'pointer',
    userSelect: 'none',
    border: border ? `1px solid ${Colors.Background.Border}` : undefined,
    '&[data-active="true"]': {
      background: `${background}`
    },
    ':hover': {
      background: `${background}`
    },
    ':active': {
      background: `${Colors.Background.ButtonActive}`
    }
  })
}
