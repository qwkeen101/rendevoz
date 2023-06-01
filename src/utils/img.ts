import { ipcInstance, IpcResponse } from '@/plugins'
import { Size, XYPosition } from '~/typings'

export const saveImageLocally = async (
  imgData: string | Blob,
  options: {
    imgName?: string
    compress: boolean
  } = {
    compress: true
  }
): Promise<IpcResponse<any>> => {
  const data = imgData
  const { compress, imgName } = options
  if (imgData instanceof Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      if (!compress) {
        reader.readAsDataURL(imgData)
        reader.onload = () => {
          ipcInstance.send('saveImage', imgName, reader.result).then(data => resolve(data))
        }

        return
      }
      reader.readAsArrayBuffer(imgData)
      reader.onload = () => {
        if (reader.result) {
          const blob = new Blob([reader.result as ArrayBuffer])
          const blobUrl = window.URL.createObjectURL(blob)
          const image = new Image()
          image.src = blobUrl
          image.onload = () => {
            const canvas = document.createElement('canvas')
            let width = image.width
            let height = image.height
            const max_height = 1080
            const max_width = 1920
            if (width > height) {
              if (width > max_width) {
                //height *= max_width / width;
                height = Math.round((height *= max_width / width))
                width = max_width
              }
            } else {
              if (height > max_height) {
                //width *= max_height / height;
                width = Math.round((width *= max_height / height))
                height = max_height
              }
            }
            canvas.width = width
            canvas.height = height
            canvas.getContext('2d')?.drawImage(image, 0, 0, width, height)
            const newImageUrl = canvas.toDataURL('image/jpeg', 0.8)

            ipcInstance.send('saveImage', imgName, newImageUrl).then(data => resolve(data))
          }
        }
      }
      reader.onerror = () => {
        reject()
      }
    })
  }
  if (typeof imgData === 'string') {
    return ipcInstance.send('saveImage', imgName, data)
  }
  return ipcInstance.send('saveImage', imgName, imgData)
}

// return dataUrl
export const captureWebpage = (webviewId?: number, rect?: XYPosition & Size) => {
  return ipcInstance.send<string>('captureWebpage', webviewId, rect)
}

export const imageToDataUrl = (img: HTMLImageElement) => {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  canvas.getContext('2d')?.drawImage(img, 0, 0, img.width, img.height)
  return canvas.toDataURL('image/png')
}

export const fetchRemoteImageAndSaveLocally = async (remoteImageUrl: string): Promise<string> => {
  const imageBlob = await (
    await fetch(remoteImageUrl, {
      method: 'GET',
      referrer: ''
    })
  ).blob()
  const data = await saveImageLocally(imageBlob, { compress: false })
  return data.data
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
