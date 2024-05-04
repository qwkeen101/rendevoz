export function resizeCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = ctx.canvas.width
  tempCanvas.height = ctx.canvas.height
  const tempCtx = tempCanvas.getContext('2d')
  tempCtx?.drawImage(ctx.canvas, 0, 0)
  ctx.canvas.width = width
  ctx.canvas.height = height

  ctx.drawImage(tempCanvas, 0, 0, ctx.canvas.width, ctx.canvas.height)
}
export async function resizeImageData(imageData: ImageData, width: number, height: number) {
  const resizeWidth = width >> 0
  const resizeHeight = height >> 0
  const ibm = await window.createImageBitmap(imageData, 0, 0, imageData.width, imageData.height, {
    resizeWidth,
    resizeHeight
  })
  const canvas = document.createElement('canvas')
  canvas.width = resizeWidth
  canvas.height = resizeHeight
  const ctx = canvas.getContext('2d')
  ctx.scale(resizeWidth / imageData.width, resizeHeight / imageData.height)
  ctx.drawImage(ibm, 0, 0)
  return ctx.getImageData(0, 0, resizeWidth, resizeHeight)
}
