function getFileNameAndExtension(url: string) {
  try {
    const pathname = new URL(url).pathname // 获取路径部分
    const fileName = decodeURIComponent(pathname.split('/').pop() || '') // 获取最后的文件名
    if (fileName.includes('.')) {
      const [name, ...extParts] = fileName.split('.')
      return {
        name: name, // 文件名
        extension: extParts.join('.') // 文件扩展名
      }
    }
    return {
      name: fileName, // 只有文件名，无扩展名
      extension: '' // 无扩展名
    }
  } catch (error) {
    return {
      name: '',
      extension: ''
    }
  }
}

type IFileType = 'video' | 'audio' | 'pdf' | 'image'
const fileTypes: Record<IFileType, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'ico', 'svg'],
  video: ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm', 'mpeg'],
  audio: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'm4a', 'aiff', 'amr'],
  pdf: ['pdf']
}
export default async (url: string) => {
  let type: IFileType | undefined = undefined
  const { extension, name } = getFileNameAndExtension(url)
  // 先从url本身判断
  if (extension) {
    for (const [fileType, extensions] of Object.entries(fileTypes)) {
      if (extensions.includes(extension)) {
        type = fileType as IFileType
      }
    }
    if (type) {
      return {
        name,
        type,
        extension
      }
    }
  }
  const contentType = await fetch(url, { method: 'HEAD' }).then(i => i.headers.get('Content-Type'))
  // must have content type, text/html, or file
  if (!contentType) return Promise.reject()
  switch (true) {
    case contentType.includes('video'): {
      type = 'video'
      break
    }
    case contentType.includes('audio'): {
      type = 'audio'
      break
    }
    case contentType.includes('image'): {
      type = 'image'
      break
    }
    case contentType.includes('pdf'): {
      type = 'pdf'
      break
    }
  }
  if (type) {
    const pathname = new URL(url).pathname
    const fileName = decodeURIComponent(pathname.split('/').pop() || '')
    return {
      name: fileName,
      type,
      extension: ''
    }
  }
  return
}
