import { getFilenameWithoutExtension, saveFileLocally, saveImageLocally } from '@/utils'
import { ObjectStore } from '@/stores'
import { generateVideoThumbnail } from '@/core/video/utils'

const importvideo = async (file: File) => {
  const name = getFilenameWithoutExtension(file.name)
  const path = file.path

  const filePath = await saveFileLocally(path, name)
  const cover = await generateVideoThumbnail(file)
  const imagePath = await saveImageLocally(cover, { compress: false })
  if(filePath){
    const res = await ObjectStore('video').addOneWithMeta(
      { videoUrl: filePath.data },
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
