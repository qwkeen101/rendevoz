import { ipcInstance } from '@/electron'
import { Size, XYPosition } from '~/typings'
import ColorThief from 'colorthief'
import FileSystem from '@/api/fileSystem'
const colorThief = new ColorThief()

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
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  canvas.getContext('2d')?.drawImage(img, 0, 0, img.width, img.height)
  return canvas.toDataURL('image/png')
}

/**
 * Return: local img path
 */
export const fetchRemoteImageAndSaveLocally = FileSystem.fetchRemoteImageAndSaveLocally

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

/**
 * Return: R,G,B
 */
export const getMainColorOfImage = (image: HTMLImageElement | string): Promise<[number, number, number]> => {
  return new Promise(res => {
    if (typeof image === 'string') {
      const imageEle = new Image()
      imageEle.src = image
      imageEle.onload = () => {
        res(colorThief.getColor(imageEle))
      }
    } else {
      if (image.complete) {
        res(colorThief.getColor(image))
      } else {
        image.onload = () => {
          res(colorThief.getColor(image))
        }
      }
    }
  })
}

export const calculateImageAspectRatio = (srcWidth: number, srcHeight: number, maxWidth: number, maxHeight: number) => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
  return { width: srcWidth * ratio, height: srcHeight * ratio }
}
