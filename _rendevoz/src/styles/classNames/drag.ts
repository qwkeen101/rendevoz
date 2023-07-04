import { css } from '@emotion/css'

export const droppableItemHovered = (droppable = true) =>
  css({
    cursor: droppable ? 'default' : 'not-allowed !important',
    boxShadow: droppable ? 'rgb(130, 170, 227, 0.4) 0px 0px 0px 3px' : 'rgb(255, 100, 100, 0.4) 0px 0px 0px 3px',
    transition: 'all 0.3s ease',
    background: 'transparent !important',
    borderRadius: 4
  })
