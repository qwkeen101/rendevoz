import { findPathsBetweenTwoMetaObjects } from '@/core/graph/utils/findPathsBetweenTwoNodes'
import { t } from 'i18next'
import { TypeToTypeName } from '@/core'
import { getFilenameWithoutExtension, saveFileLocally, saveImageLocally } from '@/utils'
import { MetaStore, ObjectStore } from '@/stores'
import { generateVideoThumbnail } from '@/core/video/utils'
import { initializePdfDocument } from '@/stores/document.store'

// supports PDF, video, image only
const addMetaObjectFromFile = async (file: File) => {
  const name = getFilenameWithoutExtension(file.name)
  if (file.type === 'application/pdf') {
    const pdf = await initializePdfDocument(file)
    if (!pdf) return
    const obj = await ObjectStore('pdf').addOne({ ...pdf })
    const meta = await MetaStore.addMetaObject({ type: 'pdf', objectId: obj.id, name: pdf.name, coverImgSrc: pdf.metadata?.coverUrl })
    return meta
  }
  if (file.type.startsWith('image')) {
    const imgSrc = await saveImageLocally(file, { compress: false })
    const image = await ObjectStore('image').addOne({ imageUrl: imgSrc })
    const meta = await MetaStore.addMetaObject({ type: 'image', objectId: image.id, coverImgSrc: imgSrc, name })
    return meta
  }
  if (file.type.startsWith('video')) {
    const result = await saveFileLocally(file.path, file.name)
    if (!result) return
    const image = await generateVideoThumbnail(file)
    const coverImgSrc = await saveImageLocally(image, { compress: false })
    const video = await ObjectStore('video').addOne({ videoUrl: result.data })
    const meta = await MetaStore.addMetaObject({ type: 'video', objectId: video.id, coverImgSrc, name })
    return meta
  }
}

const Meta = {
  findPathsBetweenTwoMetaObjects,
  getTypeName: (type: string) => {
    return t(`general.${TypeToTypeName[type]}`)
  },
  addMetaObjectFromFile
}

export default Meta
