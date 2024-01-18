import Colors from '@/consts/colors'
import { css } from '@emotion/css'

export const circleButton = (padding = 4, borderRadius = 999) => {
  return css({
    transition: 'all 0.2s ease',
    padding,
    cursor: 'pointer',
    borderRadius,
    height: 'fit-content',
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
    height: 'fit-content',
    cursor: 'pointer',
    userSelect: 'none',
    flexShrink: 0,
    background: 'rgb(35, 131, 226)',
    fontWeight: 500,
    color: 'white',
    boxShadow: 'var(--border-background) 0px 0px 0px 1px inset, var(--border-background) 0px 1px 2px',
    '&[data-active="true"]': {
      background: `rgb(0,107,199) !important`
    },
    ':hover': {
      background: `rgb(0,119,212) !important`
    },
    ':active': {
      background: `rgb(0,107,199) !important`
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
    height: 'fit-content',
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
