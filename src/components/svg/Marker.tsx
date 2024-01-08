import { Colors, MarkerColor } from '@/consts'
import { memo, useState } from 'react'
import { GlobalInstance, useSelectAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'
import { assignProperties } from '@/utils'
function getMarkerId(direction: 'end' | 'start', color: string) {
  return `${direction}-arrow-${color}`
}

const SvgMarker = () => {
  const darkMode = useSelectAtomValue(SettingAtom, s => s.general.darkMode)
  const [extraColors, setExtraColors] = useState<string[]>([])
  assignProperties(GlobalInstance, {
    commonOps: {
      ...GlobalInstance.commonOps,
      addExtraSvgArrows: color => {
        if (extraColors.includes(color)) return
        setExtraColors([...extraColors, color])
      }
    }
  })
  return (
    <defs>
      <linearGradient id="mygradient" x1="80.86%" x2="19.14%" y1="0%" y2="100%">
        <stop offset="0%" stopColor="#9100ef" />
        <stop offset="100%" stopColor="#5f5ffd" />
      </linearGradient>
      {[...(Object.values(MarkerColor) as string[]), ...extraColors].map(color =>
        color === MarkerColor.PRIMARY ? (
          <marker
            refX={0}
            refY={0}
            markerUnits="strokeWidth"
            viewBox="-10,-10,20,20"
            orient="auto"
            key={color}
            id={getMarkerId('end', color)}
            markerWidth={15}
            markerHeight={15}
          >
            <polyline
              stroke={darkMode ? 'white' : 'black'}
              fill={darkMode ? 'white' : 'black'}
              strokeWidth={1}
              points="-5,-4 0,0 -5,4 -5,-4"
              strokeLinejoin="round"
              strokeLinecap="round"
            ></polyline>
          </marker>
        ) : (
          <marker
            refX={0}
            refY={0}
            markerUnits="strokeWidth"
            viewBox="-10,-10,20,20"
            orient="auto"
            key={color}
            id={getMarkerId('end', color)}
            markerWidth={15}
            markerHeight={15}
          >
            <polyline
              stroke={color}
              fill={color}
              strokeWidth={1}
              points="-5,-4 0,0 -5,4 -5,-4"
              strokeLinejoin="round"
              strokeLinecap="round"
            ></polyline>
          </marker>
        )
      )}
    </defs>
  )
}

export default memo(SvgMarker)
