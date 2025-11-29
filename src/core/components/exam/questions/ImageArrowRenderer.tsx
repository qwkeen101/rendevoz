import { IExamImageOcclusionQuestion } from '~/typings'
import { memo } from 'react'
import { Colors } from '@/consts'

export default memo(
  ({
    position,
    color,
    isSelected
  }: Required<IExamImageOcclusionQuestion>['arrows'][0] & {
    isSelected: boolean
  }) => {
    const arrowLength = 1.4 // 箭头长度（基于 viewBox 的大小）
    const [x1, y1, x2, y2] = position
    // 计算角度
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const lineEnd = {
      x: x2 - 1 * Math.cos(angle),
      y: y2 - 1 * Math.sin(angle)
    }

    // 计算箭头的两侧点
    const arrowPoint1 = {
      x: x2 - arrowLength * Math.cos(angle - Math.PI / 6),
      y: y2 - arrowLength * Math.sin(angle - Math.PI / 6)
    }

    const arrowPoint2 = {
      x: x2 - arrowLength * Math.cos(angle + Math.PI / 6),
      y: y2 - arrowLength * Math.sin(angle + Math.PI / 6)
    }

    const renderSelected = () => {
      if (isSelected) {
        const bbox = {
          left: Math.min(x1, x2),
          top: Math.min(y1, y2),
          width: Math.abs(x2 - x1),
          height: Math.abs(y2 - y1)
        }
        return (
          <rect
            fill={'transparent'}
            stroke={'var(--select-color)'}
            strokeWidth={0.25}
            rx={0.5}
            ry={0.5}
            x={bbox.left}
            y={bbox.top}
            width={bbox.width}
            height={bbox.height}
          />
        )
      }
    }
    return (
      <g>
        <line x1={x1} y1={y1} x2={lineEnd.x} y2={lineEnd.y} stroke={Colors.getAdaptColor(color)} strokeWidth={0.3} />
        <polygon
          points={`${x2},${y2} ${arrowPoint1.x},${arrowPoint1.y} ${arrowPoint2.x},${arrowPoint2.y}`}
          fill={Colors.getAdaptColor(color)}
        />
        {renderSelected()}
      </g>
    )
  }
)
