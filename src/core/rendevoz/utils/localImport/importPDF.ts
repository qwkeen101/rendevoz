import { initializePdfDocument } from '@/api/stores/document.store'
import { ObjectStore } from '@/api/stores'
import { IPdfDocument, MetaObject } from '~/typings'
import { IImportResult } from '@/core/rendevoz/utils/types'

const importPDF = async (file: File): Promise<IImportResult<IPdfDocument>> => {
  const doc = await initializePdfDocument(file)
  if (doc) {
    return {
      object: {
        ...doc
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
