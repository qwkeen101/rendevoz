import { getFilenameWithoutExtension } from '@/utils'
import { ObjectStore } from '@/api/stores'
import { generateVideoThumbnail } from '@/core/components/media/utils'
import FileSystem from '@/api/fileSystem'

const importvideo = async (file: File) => {
  const name = getFilenameWithoutExtension(file.name)
  const path = file.path

  const filePath = await FileSystem.copyFile(path, name)
  const cover = await generateVideoThumbnail(file)
  const imagePath = await FileSystem.saveImage(cover)
  if (filePath) {
    const res = await ObjectStore('video').addOneWithMeta(
      { url: filePath },
      {
        currentMeta: {
          name: name,
          coverImgSrc: imagePath
        }
      }
    )
    return res.meta
  }
}
export default importvideo
