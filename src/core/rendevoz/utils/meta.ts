import { findPathsBetweenTwoMetaObjects } from '@/core/components/graph/utils/findPathsBetweenTwoNodes'
import { t } from 'i18next'
import importPDF from '@/core/rendevoz/utils/localImport/importPDF'
import importVideo from '@/core/rendevoz/utils/localImport/importVideo'
import importimage from '@/core/rendevoz/utils/localImport/importImage'
import { IImportResult } from '~/typings/rendevoz'
import importImage from '@/core/rendevoz/utils/localImport/importImage'
import importAudio from '@/core/rendevoz/utils/localImport/importAudio'
import { Rendevoz } from '@/core/rendevoz'
import importMarkdown from '@/core/rendevoz/utils/localImport/importMarkdown'

// supports PDF, video, image only
const addMetaObjectFromFile = async (file: File) => {
  if (file.type === 'application/pdf') {
    return await importPDF(file)
  }
  if (file.type.startsWith('image')) {
    return await importimage(file)
  }
  if (file.type.startsWith('video')) {
    return await importVideo(file)
  }
}

const normalizeLocalFileToMeta = async (
  file: File,
  options?: {
    limitType?: boolean
  }
): Promise<IImportResult<any>> => {
  if (file.name.endsWith('.md')) {
    return await importMarkdown(file)
  }
  if (file.type === 'application/pdf') {
    return await importPDF(file)
  }
  if (file.type.startsWith('image')) {
    return await importImage(file)
  }
  if (file.type.startsWith('video')) {
    return await importVideo(file)
  }
  if (file.type.startsWith('audio')) {
    return await importAudio(file)
  }
  if (options?.limitType === false) {
    return {
      object: {
        specType: 'localFile',
        url: file.path
      },
      meta: {
        name: file.name,
        type: 'localFile'
      }
    }
  }
  throw 'Failed to import file!'
}

const normalizeWebFileToMeta = async (url: string, type: string): Promise<IImportResult<any>> => {
  const details = await Rendevoz.Utils.Web.fetchDetails(url)
  console.log(details)
  return {
    meta: {
      name: details.title,
      coverImgSrc: details.image,
      description: details.description,
      type
    },
    object: {
      url,
      specType: type
    }
  }
}

const Meta = {
  findPathsBetweenTwoMetaObjects,
  getTypeName: (type: string) => {
    if (!type) {
      return 'Unknown'
    }
    return t(`general.${type}`)
  },
  getTypeRadius: (type: string) => {
    return 15
  },
  addMetaObjectFromFile,
  normalizeLocalFileToMeta,
  normalizeWebFileToMeta
}

export default Meta
