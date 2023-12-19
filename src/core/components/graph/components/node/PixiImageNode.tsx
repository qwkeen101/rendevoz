import { GraphNode } from '@/core/components/graph/types/node'
import { Graphics as RGrahpics, Sprite, Text } from '@pixi/react'
import { Graphics } from 'pixi.js'
import { useCallback, useEffect, useState } from 'react'
import { Queue } from 'async-await-queue'
import { Rendevoz } from '@/core/rendevoz'

const getRadius = Rendevoz.Utils.Meta.getTypeRadius
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
const radius = 10
const x = 0,
  y = 0,
  width = 60,
  height = 60

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

cropCanvas.width = 60
cropCanvas.height = 60
transformCtx(ctx)

const queue = new Queue(1, 0)
const prior = -1
const PixiImageNode = ({ node, imageUrl, label }: { node: GraphNode; imageUrl?: string; label?: string }) => {
  const realImageUrl = imageUrl || node.coverImgSrc
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
              ctx.drawImage(img, x, y, scaledSize, scaledSize, 0, 0, 60, 60)
              const data = cropCanvas.toDataURL('image/webp', 0.2)
              setImage(data)
              // ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height)
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
      g.beginFill('#8590ae')
      g.drawCircle(radius, radius, radius)
      g.endFill()
    },
    [radius]
  )

  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image)
      }
    }
  }, [])
  return (
    <>
      {realImageUrl ? (
        <>
          <RGrahpics x={0} y={0} anchor={0} draw={drawMask} />
          {image && <Sprite image={image} x={0} y={0} anchor={0} width={d} height={d} />}
        </>
      ) : (
        <RGrahpics x={0} y={0} anchor={0} draw={drawCircle} />
      )}
    </>
  )
}

export default PixiImageNode
