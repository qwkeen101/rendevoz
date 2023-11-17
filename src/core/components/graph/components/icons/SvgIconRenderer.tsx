import { cloneElement, memo } from 'react'
import { NAME_TO_ICON } from './map'

const SvgIconRenderer = memo(
  ({ fill, icon, size, x, y }: { fill: string; icon: keyof typeof NAME_TO_ICON; size: number; x: number; y: number }) => {
    const ele = NAME_TO_ICON[icon]
    return cloneElement(
      <svg></svg>,
      {
        width: size,
        height: size,
        color: fill,
        viewBox: '0 0 48 48',
        x,
        y
      },
      <g>{ele}</g>
    )
  }
)

export default SvgIconRenderer
