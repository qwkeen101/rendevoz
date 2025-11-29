import { ipcInstance } from '@/electron'
import { Size, XYPosition } from '~/typings'
import FileSystem from '@/api/fileSystem'
/**
 * Return: saved local path of img
 */
export const saveImageLocally = FileSystem.saveImage

/**
 * Return: DataUrl of captured webpage image
 */
export const captureWebpage = async (webviewId?: number, rect?: XYPosition & Size) => {
  return (await ipcInstance.send<string>('captureWebpage', webviewId, rect)).data
}

export const deleteLocalFile = async (filepath: string) => {
  return (await ipcInstance.send('deleteLocalFile', filepath)).data
}

export const imageToDataUrl = (img: HTMLImageElement) => {
  if (img instanceof HTMLImageElement) {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    canvas.getContext('2d')?.drawImage(img, 0, 0, img.width, img.height)
    return canvas.toDataURL('image/png')
  }
}

export const downloadImg = async (imageUrl: string, imageName?: string) => {
  const data = await (await fetch(imageUrl, { method: 'GET', referrer: '' })).blob()
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = imageName || imageUrl
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
export const calculateImageAspectRatio = (srcWidth: number, srcHeight: number, maxWidth: number, maxHeight: number) => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
  return { width: srcWidth * ratio, height: srcHeight * ratio }
}
