import { IPdfDocument } from '~/typings'
import { IImportResult } from '.'
import DataUtils from '@/api/stores/utils'

const importPDF = async (file: File): Promise<IImportResult<IPdfDocument>> => {
  const doc = await DataUtils.document.initializePdfDocument(file)
  if (doc) {
    return {
      object: {
        ...doc,
        specType: 'pdf'
      },
      meta: {
        name: doc.name,
        coverImgSrc: doc.metadata?.coverUrl,
        type: 'pdf'
      }
    }
  } else {
    throw 'Failed to initialize PDF file!'
  }
}
export default importPDF
