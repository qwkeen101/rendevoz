import getSetting from '@/core/setting/getSetting'
import useDb from '@/hooks/stores/useDb'
import PdfJs from '@/consts/pdfJs'
import { saveFileLocally } from '@/utils/file'
import Id from '@/utils/id'
import { saveImageLocally } from '@/utils/img'
import { atom } from 'jotai/vanilla'
import toast from 'react-hot-toast'
import { IPdfDocument } from '~/typings/data'
import { initializeLocalStore } from './base.store'

import { IStoreDeprecated } from './store.type'
import { MetaStore } from '.'
import usePdfjs from '@/hooks/utils/usePdfjs'
import { SearchStore, SearchableDocument } from './search.store'

export const documentsAtom = atom<Map<number, IPdfDocument>>(new Map())

export const initializePdfDocument = async (file: File): Promise<Partial<IPdfDocument> | undefined> => {
  if (file.type === 'application/pdf') {
    const pdfDocument: Partial<IPdfDocument> = {
      name: file.name || 'Unnamed PDF'
    }
    const buffer = await file.arrayBuffer()
    const loadingTask = PdfJs.getDocument(new Uint8Array(buffer))
    const pdf = await loadingTask.promise

    const metadata = await pdf.getMetadata()
    const { Title, Author } = metadata.info
    pdfDocument.metadata = {
      title: Title,
      author: Author
    }

    const page = await pdf.getPage(1)
    const scale = 1
    const viewport = page.getViewport({ scale: scale })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width
    const renderCtx = { canvasContext: ctx, viewport: viewport }
    const renderTask = page.render(renderCtx)

    await renderTask.promise
    const data = canvas.toDataURL('image/png')
    const result = await Promise.all([saveImageLocally(Id.getStrId(), data), saveFileLocally(file.path, file.name)])
    const imageResult = result[0]
    pdfDocument.metadata = {
      ...pdfDocument.metadata,
      coverUrl: imageResult.data
    }
    const pdfResult = result[1]
    pdfDocument.fileUrl = pdfResult.data
    return pdfDocument
  }
}
export const savePdfAsSearch = async (pdfFile: File | Uint8Array, pdfId: number) => {
  const PdfJs = usePdfjs()
  if ((pdfFile instanceof File && pdfFile.type === 'application/pdf') || pdfFile instanceof Uint8Array) {
    const buffer = await (pdfFile instanceof Uint8Array ? pdfFile : pdfFile.arrayBuffer())
    const loadingTask = PdfJs.getDocument(new Uint8Array(buffer))
    const pdf = await loadingTask.promise
    const allTexts = await Promise.all(
      Array.from(Array(pdf.numPages).keys()).map(async (i, idx) => {
        const page = await pdf.getPage(idx + 1)
        const text = await page.getTextContent()
        return {
          pageIndex: idx,
          specType: 'pdfPage',
          content: text.items.map(item => item.str).join(' '),
          targetObjectId: pdfId,
          id: Id.getId()
        } as SearchableDocument
      })
    )
    const filtered = allTexts.filter(i => i.content.length)
    SearchStore.addDocuments(filtered)
  }
}
const createDocumentStore = () => {
  const database = useDb('documents')

  const store = initializeLocalStore(documentsAtom, database)

  const shouldToast = (silent?: boolean) => {
    const setting = getSetting()
    if (setting.notification.enabled && setting.notification.pdf && !silent) {
      return true
    }
    return false
  }
  const localStore: Pick<IStoreDeprecated<IPdfDocument>, 'addOne' | 'deleteOneById' | 'getAll' | 'getOneById' | 'updateOne'> = {
    addOne: store.addOne((obj, silent) => {
      MetaStore.addMetaObject(
        {
          id: Id.getId(),
          objectId: obj.id,
          type: 'pdf'
        },
        true
      )
      !silent && shouldToast(silent) && toast.success('Document successfully added!')
    }),
    updateOne: store.updateOne((obj, silent) => {
      !silent && shouldToast(silent) && toast.success('Document successfully updated!')
    }),
    deleteOneById: store.deleteOneById(silent => {
      !silent && shouldToast(silent) && toast.success('Document successfully deleted!')
    }),
    getAll: store.getAll(),
    getOneById: store.getOneById()
  }
  const realStore = {
    getDocumentById: localStore.getOneById,
    addDocument: localStore.addOne,
    deleteDocument: localStore.deleteOneById,
    getAllDocuments: localStore.getAll,
    updateDocument: localStore.updateOne
  }
  return {
    ...realStore
  }
}
const shouldToast = (silent?: boolean) => {
  const setting = getSetting()
  if (setting.notification.enabled && setting.notification.pdf && !silent) {
    return true
  }
  return false
}

export const documentStore = createDocumentStore()

export default createDocumentStore
