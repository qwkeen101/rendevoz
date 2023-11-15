import FileSystem from '@/api/fileSystem'
import { MetaStore, ObjectStore } from '@/api/stores'

export default async (file: File) => {
  const imgSrc = await FileSystem.saveImage(file, { compress: false })
  const image = await ObjectStore('image').addOne({ imageUrl: imgSrc })
  const meta = await MetaStore.addMetaObject({ type: 'image', objectId: image.id, coverImgSrc: imgSrc, name })
  return meta
}
