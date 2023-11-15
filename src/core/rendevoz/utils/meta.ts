import { findPathsBetweenTwoMetaObjects } from '@/core/graph/utils/findPathsBetweenTwoNodes'
import { t } from 'i18next'
import { TypeToTypeName } from '@/core'
import { getFilenameWithoutExtension, saveFileLocally, saveImageLocally } from '@/utils'
import { MetaStore, ObjectStore } from '@/api/stores'
import { generateVideoThumbnail } from '@/core/media/utils'
import { initializePdfDocument } from '@/api/stores/document.store'
import importpdf from '@/core/global/imports/importpdf'
import importvideo from '@/core/global/imports/importvideo'
import importimage from '@/core/global/imports/importimage'

// supports PDF, video, image only
const addMetaObjectFromFile = async (file: File) => {
  if (file.type === 'application/pdf') {
    return await importpdf(file)
  }
  if (file.type.startsWith('image')) {
    return await importimage(file)
  }
  if (file.type.startsWith('video')) {
    return await importvideo(file)
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
