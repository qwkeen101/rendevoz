import { md5 } from 'js-md5'
import Id from '@/utils/id'
import FileSystem from '@/api/fileSystem/index'

export const saveImageLocally = async (
  imgData: string | Blob | File,
  options: {
    imgName?: string
    compress: boolean
  } = {
    compress: true
  }
): Promise<string> => {
  const fs = FileSystem.fs
  let data: Blob | undefined = undefined
  const { compress, imgName } = options
  if (imgData instanceof Blob) {
    if (imgData.type.includes('gif')) {
      return await fs.writeFile(imgData, `/imgs/${imgName ?? `${Id.getId()}.gif`}`)
    }
    if (compress) {
      const blobUrl = window.URL.createObjectURL(imgData)
      const image = new Image()
      image.src = blobUrl
      data = await new Promise(res => {
        image.onload = () => {
          const canvas = document.createElement('canvas')
          let width = image.width
          let height = image.height
          const max_height = 720
          const max_width = 1280
          if (width > height) {
            if (width > max_width) {
              height = Math.round((height *= max_width / width))
              width = max_width
            }
          } else {
            if (height > max_height) {
              width = Math.round((width *= max_height / height))
              height = max_height
            }
          }
          canvas.width = width
          canvas.height = height
          canvas.getContext('2d')?.drawImage(image, 0, 0, width, height)
          canvas.toBlob(b => {
            URL.revokeObjectURL(blobUrl)
            res(b)
          })
        }
      })
    } else {
      data = imgData
    }
  } else {
    data = await fetch(imgData).then(i => i.blob())
  }
  if (data) {
    const path = await fs.writeFile(data, `/imgs/${imgName ?? md5(await data.text())}.png`)
    return path
  }
  throw new Error('Failed to save image!')
}

export const saveFileLocally = async (filePath: string, fileName: string): Promise<string> => {
  const getSetting = (await import('@/core')).getSetting
  const setting = getSetting()
  const fs = FileSystem.fs
  if (setting.general.copyFileWhenImport) {
    return await fs.copyFile(filePath, `/files/${fileName}`)
  } else {
    return `file://${filePath}`
  }
}
