import FileSystem from '@/api/fileSystem'
import { IImportResult } from '@/core/rendevoz/utils/types'
import { IImage } from '~/typings'

export default async (file: File): Promise<IImportResult<IImage>> => {
  const imgSrc = await FileSystem.saveImage(file, { compress: false })
  return {
    object: {
      url: imgSrc
    },
    meta: {
      name: file.name,
      coverImgSrc: imgSrc,
      type: 'image'
    }
  }
}
