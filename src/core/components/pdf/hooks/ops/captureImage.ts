import { Box, IPDFInstance } from '~/typings'
import { renderPageInDarkMode, renderPageInNormalMode } from '@/core/components/pdf/core/utils/renderer'
import { calculateImageAspectRatio } from '@/utils'
import FileSystem from '@/api/fileSystem'

export default async (page: number, instance: IPDFInstance, box?: Box) => {
  const doc = await instance.getDocument?.()
  if (doc) {
    const p = await doc.getPage(page + 1)
    const c = document.createElement('canvas')
    const viewport = p.getViewport({ scale: 1.5 })
    const resolution = window.devicePixelRatio
    c.width = viewport.width * resolution
    c.height = viewport.height * resolution
    renderPageInDarkMode()
    const r = p.render({ canvasContext: c.getContext('2d')!, viewport, transform: [resolution, 0, 0, resolution, 0, 0] })
    await r.promise
    renderPageInNormalMode()
    if (box) {
      const newCanvas = document.createElement('canvas')
      const originalWidth = viewport.width * box.width * resolution
      const originalHeight = viewport.height * box.height * resolution
      const { width, height } = calculateImageAspectRatio(originalWidth, originalHeight, 1200, 1200)
      newCanvas.width = width
      newCanvas.height = height
      newCanvas
        .getContext('2d')
        ?.drawImage(
          c,
          viewport.width * box.left * resolution,
          viewport.height * box.top * resolution,
          viewport.width * box.width * resolution,
          viewport.height * box.height * resolution,
          0,
          0,
          width,
          height
        )
      const dataURL = newCanvas.toDataURL()
      return await FileSystem.saveImage(dataURL, { compress: false })
      // return dataURL
    } else {
      const dataURL = c.toDataURL()
      // return dataURL
      return await FileSystem.saveImage(dataURL, { compress: false })
    }
  }
}
