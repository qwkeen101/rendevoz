import { css } from '@emotion/css'

export const input = () =>
  css({
    padding: '12px 16px',
    width: '100%',
    outline: 'none',
    position: 'relative',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '-0.04px',
    color: 'rgba(31,34,37,0.9)',
    borderRadius: 6,
    border: 'none',
    boxShadow: 'rgba(31,34,37,0.06) 0px 0px 0px 1px inset',
    background: 'rgba(31,34,37,0.03)',
    transition: 'all 0.2s ease',
    ':hover': {
      background: 'rgba(31,34,37,0.06)'
    },
    ':focus': {
      boxShadow: 'rgba(133, 144, 174, 0.5) 0px 0px 0px 1px inset'
    }
  })
