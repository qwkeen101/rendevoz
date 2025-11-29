import { getFilenameWithoutExtension } from '@/utils'
import { generateVideoThumbnail } from '@/core/components/media/utils'
import FileSystem from '@/api/fileSystem'
import { IImportResult } from '.'
import { IVideo } from '~/typings'

const importVideo = async (file: File): Promise<IImportResult<IVideo>> => {
  const name = getFilenameWithoutExtension(file.name)
  const filePath = await FileSystem.saveFile(file)
  const cover = await generateVideoThumbnail(file)
  const imagePath = await FileSystem.saveImage(cover)
  if (filePath) {
    return {
      object: {
        url: filePath,
        specType: 'video'
      },
      meta: {
        name,
        coverImgSrc: imagePath,
        type: 'video'
      }
    }
  }
  throw 'Failed to import video!'
}
export default importVideo
