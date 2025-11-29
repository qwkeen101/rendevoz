import { useCallback } from 'react'
import { Graphics } from 'pixi.js'
import { Graphics as RGrahpics } from '@pixi/react'
import { Colors } from '@/consts'
export default ({ size, color }: { size: number; color: string }) => {
  const drawCircle = useCallback(
    (g: Graphics) => {
      g.clear()
      g.beginFill(Colors.getAdaptColor(color))
      g.drawCircle(size, size, size)
      g.endFill()
    },
    [size, color]
  )
  return <RGrahpics x={0} y={0} anchor={0} draw={drawCircle}></RGrahpics>
}
