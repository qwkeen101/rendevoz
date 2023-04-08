import Colors from '@/consts/colors'
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
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    boxShadow: `${Colors.Background.Border} 0px 0px 0px 1px inset`,
    transition: 'all 0.2s ease',
    ':hover': {
      background: `${Colors.Background.Border}`
    },
    ':focus': {
      boxShadow: 'var(--font-secondary) 0px 0px 0px 1px inset'
    }
  })
