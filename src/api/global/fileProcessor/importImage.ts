import FileSystem from '@/api/fileSystem'
import { IImportResult } from '.'
import { IImage } from '~/typings'
import { getFilenameWithoutExtension } from '@/utils'

export default async (file: File): Promise<IImportResult<IImage>> => {
  const imgSrc = await FileSystem.saveImage(file, { compress: false })
  return {
    object: {
      url: imgSrc,
      specType: 'image'
    },
    meta: {
      name: getFilenameWithoutExtension(file.name),
      coverImgSrc: imgSrc,
      type: 'image'
    }
  }
}
