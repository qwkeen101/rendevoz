import { css } from '@emotion/css'

export const gridLayout = ({
  rowGap = 30,
  columnGap = 30,
  itemMinWidth = 240
}: {
  rowGap?: number
  columnGap?: number
  itemMinWidth?: number
}) =>
  css({
    display: 'grid !important',
    rowGap,
    columnGap,
    gridTemplateColumns: `repeat(auto-fill,minmax(${itemMinWidth}), 1fr)`
  })

export const flexLayout = () => {}
