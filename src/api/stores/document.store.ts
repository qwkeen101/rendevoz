import { getFilenameWithoutExtension, saveFileLocally } from '@/utils/file'
import { saveImageLocally } from '@/utils/img'
import { IPdfDocument } from '~/typings/data'
import { globalStore, ObjectStore } from './index'

export const initializePdfDocument = async (file: File): Promise<Partial<IPdfDocument> | undefined> => {
  if (file.type === 'application/pdf') {
    const pdfDocument: Partial<IPdfDocument> = {
      name: getFilenameWithoutExtension(file.name) || 'Unnamed PDF'
    }
    const buffer = await file.arrayBuffer()
    const loadingTask = window['pdfjs-dist/build/pdf']?.getDocument(new Uint8Array(buffer))
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
    const data = await new Promise(res => canvas.toBlob(res))
    const result = await Promise.all([saveImageLocally(data), saveFileLocally(file.path, file.name)])
    const imageResult = result[0]
    pdfDocument.metadata = {
      ...pdfDocument.metadata,
      coverUrl: imageResult
    }
    const pdfResult = result[1]
    pdfDocument.url = pdfResult
    return pdfDocument
  }
}

export const getAllLabelsOfDocument = async (documentId: number) => {
  await ObjectStore('pdfLabel').getAll()
  const labels = Array.from(globalStore.get(ObjectStore('pdfLabel').objectMapAtom).values()).filter(i => i.documentId === documentId)
  return labels
}
