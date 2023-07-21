import { GraphNode } from '@/core/graph/types/node'
import { getRadius } from '@/core/graph/components/node/Node'
import { Graphics as RGrahpics, Sprite, Text } from '@pixi/react'
import { BLEND_MODES, Graphics, Rectangle, Texture } from 'pixi.js'
import { useCallback, useMemo, useState } from 'react'
import { fontStyle } from '@/core/graph/components/node/PixiIconNode'

function getObjectFitSize(width: number, height: number) {
  const scaledSize = width > height ? height : width
  const x = width / 2 - scaledSize / 2
  const y = height / 2 - scaledSize / 2
  return {
    x,
    y,
    scaledSize
  }
}
const cropCanvas = document.createElement('canvas')

const PixiImageNode = ({ node, imageUrl, label }: { node: GraphNode; imageUrl?: string; label?: string }) => {
  const realImageUrl = imageUrl || node.coverImgSrc
  const realLabel = label || node.label
  const radius = getRadius(node.type)
  const d = radius * 2
  const [image, setImage] = useState<string>()
  const drawMask = useCallback(
    (g: Graphics) => {
      g.beginFill('#F3EFE0', 1)
      g.drawRoundedRect(0, 0, d, d, 4)
      g.endFill()
    },
    [radius]
  )
  useMemo(() => {
    const img = new Image()
    if (realImageUrl) {
      img.src = realImageUrl
      img.onload = () => {
        const ctx = cropCanvas.getContext('2d')
        if (ctx) {
          const { y, x, scaledSize } = getObjectFitSize(img.naturalWidth, img.naturalHeight)
          cropCanvas.width = 200
          cropCanvas.height = 200

          ctx.drawImage(img, x, y, scaledSize, scaledSize, 0, 0, 200, 200)
          const data = cropCanvas.toDataURL('image/png')
          setImage(data)
          ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height)
        }
      }
    }
  }, [realImageUrl])
  const drawCircle = useCallback(
    (g: Graphics) => {
      g.clear()
      g.beginFill('#8590ae')
      g.drawCircle(radius, radius, radius)
      g.endFill()
    },
    [radius]
  )
  const primaryFontColor = getComputedStyle(document.body).getPropertyValue('--font-primary')

  return (
    <>
      {realImageUrl ? (
        <>
          <RGrahpics x={0} y={0} anchor={0} draw={drawMask} />
          {image && <Sprite image={image} x={0} blendMode={BLEND_MODES.SRC_IN} y={0} anchor={0} width={d} height={d} />}
        </>
      ) : (
        <RGrahpics x={0} y={0} anchor={0} draw={drawCircle} />
      )}
    </>
  )
}

export default PixiImageNode
