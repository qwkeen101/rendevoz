import { css } from '@emotion/css'

export const blurBackground = css({
  background: 'linear-gradient(116deg, rgba(250,250,250,0.85), rgba(244,244,244,0.85))',
  backdropFilter: 'saturate(1.5) blur(32px)'
})

export const pseudoBlubBackground = css({
  overflow: 'hidden',
  position: 'relative',
  '::before': {
    position: 'absolute',
    pointerEvents: 'none',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    content: '""',
    zIndex: -1,
    background: 'linear-gradient(116deg, rgba(250,250,250,0.85), rgba(244,244,244,0.85))',
    backdropFilter: 'saturate(1.5) blur(32px)'
  }
})
