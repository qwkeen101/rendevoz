import FileSystemAdapter from '@/api/fileSystem/adapter'
import { md5 } from 'js-md5'
import { getSetting } from '@/core'
import Id from '@/utils/id'

const turnImageIntoBase64 = (imageBlob: Blob): Promise<string> => {
  return new Promise(res => {
    const reader = new FileReader()
    reader.readAsDataURL(imageBlob)
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        res(reader.result)
      }
    }
  })
}

export const saveImageLocally = async (
  imgData: string | Blob | File,
  options: {
    imgName?: string
    compress: boolean
  } = {
    compress: true
  }
): Promise<string> => {
  const fs = FileSystemAdapter()
  let data = ''
  const { compress, imgName } = options
  if (imgData instanceof Blob) {
    if (imgData.type.includes('gif')) {
      return await fs.writeFile(imgData, `/imgs/${imgName ?? imgData.name ?? `${Id.getId()}.gif`}`, 'binary')
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
          const newImageUrl = canvas.toDataURL('image/png')
          res(newImageUrl)
        }
      })
    } else {
      data = await turnImageIntoBase64(imgData)
    }
  } else {
    data = imgData
  }
  if (data.length) {
    const striped = data.replace(/^data:image\/[a-z]+;base64,/, '')
    console.log(striped)
    return await fs.writeFile(striped, `/imgs/${imgName ?? md5(data)}.png`, 'base64')
  }
  throw new Error('Failed to save image!')
}

export const saveFileLocally = async (filePath: string, fileName: string): Promise<string> => {
  const setting = getSetting()
  const fs = FileSystemAdapter()
  if (setting.general.copyFileWhenImport) {
    return await fs.copyFile(filePath, `/files/${fileName}`)
  } else {
    return `file://${filePath}`
  }
}

export const deleteFileLocally = async (filePath: string) => {
  if (!filePath.startsWith('rendefile')) return
  const fs = FileSystemAdapter()
  return await fs.deleteFile(filePath)
}

export const fetchRemoteImageAndSaveLocally = async (remoteImageUrl: string): Promise<string> => {
  const imageBlob = await (
    await fetch(remoteImageUrl, {
      method: 'GET',
      referrer: ''
    })
  ).blob()

  const data = await saveImageLocally(imageBlob)
  return data
}
