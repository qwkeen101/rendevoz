import { GraphNode } from '@/core/components/graph/types/node'
import { Graphics as RGrahpics, Sprite } from '@pixi/react'
import { Graphics } from 'pixi.js'
import { useCallback, useEffect, useState } from 'react'
import { Queue } from 'async-await-queue'
import { Colors } from '@/consts'

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
const ctx = cropCanvas.getContext('2d')!
const radius = 8
const x = 0,
  y = 0,
  width = 100,
  height = 100

const transformCtx = ctx => {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
  ctx.clip()
}

cropCanvas.width = width
cropCanvas.height = height
transformCtx(ctx)

const queue = new Queue(2, 0)
const prior = -1
const PixiImageNode = ({ node, imageUrl, size, color }: { node: GraphNode; imageUrl?: string; size: number; color: string }) => {
  const realImageUrl = imageUrl || node.coverImgSrc
  const d = size * 2
  const [image, setImage] = useState<string>()

  useEffect(() => {
    const id = Symbol()
    queue
      .wait(id, prior)
      .then(() => {
        const img = new Image()
        if (realImageUrl) {
          img.src = realImageUrl
          img.onload = () => {
            const ctx = cropCanvas.getContext('2d')
            if (ctx) {
              const { y, x, scaledSize } = getObjectFitSize(img.naturalWidth, img.naturalHeight)
              ctx.drawImage(img, x, y, scaledSize, scaledSize, 0, 0, width, height)
              const data = cropCanvas.toDataURL('image/webp', 0.2)
              setImage(data)
            }
          }
        }
      })
      .finally(() => {
        queue.end(id)
      })
  }, [realImageUrl])
  const drawCircle = useCallback(
    (g: Graphics) => {
      g.clear()
      g.beginFill(Colors.getAdaptColor(color))
      g.drawCircle(size, size, size)
      g.endFill()
    },
    [size, color]
  )

  return (
    <>
      {image ? (
        <Sprite image={image} x={0} y={0} anchor={0} width={d} height={d} />
      ) : (
        <RGrahpics x={0} y={0} anchor={0} draw={drawCircle} />
      )}
    </>
  )
}

export default PixiImageNode
