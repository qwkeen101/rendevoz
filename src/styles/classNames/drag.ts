import { css } from '@emotion/css'

export const droppableItemHovered = (droppable = true) =>
  css({
    cursor: droppable ? 'default' : 'not-allowed !important',
    boxShadow: droppable ? '0 0 0 2px var(--select-color)' : 'var(--red) 0px 0px 0px 2px',
    background: 'transparent !important',
    borderRadius: 4
  })
