import { css } from '@emotion/css'

export const droppableItemHovered = (droppable = true) =>
  css({
    cursor: droppable ? 'default' : 'not-allowed !important',
    boxShadow: droppable ? 'var(--select-color) 0px 0px 0px 3px' : 'var(--red) 0px 0px 0px 3px',
    transition: 'all 0.3s ease',
    background: 'transparent !important',
    borderRadius: 4
  })
