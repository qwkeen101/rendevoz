import { css } from '@emotion/css'

export const nodeClassName = css({
  borderRadius: 6,
  overflow: 'visible',
  pointerEvents: 'auto'
})

export const nodeNameClassName = css({
  position: 'absolute',
  left: 0,
  top: 'calc(-4px * var(--zoom-level))',
  transform: 'translate(0, -100%) scale(var(--zoom-level))',
  transformOrigin: 'bottom left',
  maxWidth: 'calc(100% / var(--zoom-level))',
  overflow: 'hidden',
  fontSize: '1.3em',
  transition: 'all 0.3s ease',
  padding: '4px 8px',
  borderRadius: 4,
  lineHeight: 1,
  pointerEvents: 'auto',
  color: 'var(--darken-node-color)'
})
