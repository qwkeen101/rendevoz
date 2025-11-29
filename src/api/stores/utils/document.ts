import { getFilenameWithoutExtension } from '@/utils/file'
import { IPdfDocument } from '~/typings/data'
import { globalStore, ObjectStore } from '@/api/stores'
import usePdfjs from '@/hooks/utils/usePdfjs'
import fileSystem from '@/api/fileSystem'

export default {
  initializePdfDocument: async (file: File): Promise<Partial<IPdfDocument> | undefined> => {
    const pdfDocument: Partial<IPdfDocument> = {
      name: getFilenameWithoutExtension(file.name) || ''
    }
    const buffer = await file.arrayBuffer()
    const loadingTask = usePdfjs().getDocument(new Uint8Array(buffer))
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
    const result = await Promise.all([fileSystem.saveImage(data), fileSystem.saveFile(file)])
    const imageResult = result[0]
    pdfDocument.metadata = {
      ...pdfDocument.metadata,
      coverUrl: imageResult
    }
    const pdfResult = result[1]
    pdfDocument.url = pdfResult
    return pdfDocument
  },
  getAllLabelsOfDocument: async (documentId: number) => {
    await ObjectStore('pdfLabel').getAll()
    const labels = Array.from(globalStore.get(ObjectStore('pdfLabel').objectMapAtom).values()).filter(i => i.documentId === documentId)
    return labels
  }
}
