import { useMemo, useRef } from 'react'
import { useAtomValue } from 'jotai'
import { WhiteboardTransformAtom } from '@/core/components/whiteboard/hooks/useWhiteboardTransform'
import { useSelectAtomValue } from '@/hooks'
import { WhiteboardAtom } from '@/core/components/whiteboard/hooks'
import { Colors } from '@/consts'
import Id from '@/utils/id'

const patternId = 'dots'
const offset = 2
const Background = () => {
  const backgroundType = useSelectAtomValue(WhiteboardAtom, s => s?.backgroundType)

  const ref = useRef<SVGSVGElement>(null)
  const transform = useAtomValue(WhiteboardTransformAtom)
  const id = useMemo(() => `${patternId}_${Id.getId()}`, [])
  if (!backgroundType || backgroundType === 'none') return null
  const gapXY = [20, 20]
  const patternSize = 3
  const scaledGap = [gapXY[0] * transform[2] || 1, gapXY[1] * transform[2] || 1]
  const scaledSize = patternSize * transform[2]
  const patternDimensions = scaledGap
  const patternOffset =
    backgroundType === 'dot' ? [scaledSize / offset, scaledSize / offset] : [patternDimensions[0] / offset, patternDimensions[1] / offset]

  return (
    <svg
      ref={ref}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      <pattern
        id={id}
        patternTransform={`translate(-${patternOffset[0]},-${patternOffset[1]})`}
        x={transform[0] % scaledGap[0]}
        y={transform[1] % scaledGap[1]}
        width={scaledGap[0]}
        height={scaledGap[1]}
        patternUnits="userSpaceOnUse"
      >
        {backgroundType === 'dot' && <DotPattern radius={scaledSize / offset} color={Colors.Background.ButtonActive} />}
        {backgroundType === 'line' && <LinePattern color={Colors.Background.Border} dimensions={patternDimensions} lineWidth={1} />}
      </pattern>
      <rect x="0" y="0" fill={`url(#${id})`} width="100%" height="100%" />
    </svg>
  )
}

const DotPattern = ({ radius, color }: { radius: number; color: string }) => {
  return <circle cx={radius} cy={radius} r={radius} fill={color} />
}
function LinePattern({ color, dimensions, lineWidth }: { color: string; dimensions: number[]; lineWidth: number }) {
  return (
    <path
      stroke={color}
      strokeWidth={lineWidth}
      d={`M${dimensions[0] / 2} 0 V${dimensions[1]} M0 ${dimensions[1] / 2} H${dimensions[0]}`}
    />
  )
}
export default Background
