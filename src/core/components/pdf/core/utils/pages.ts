import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

const pagesMap = new WeakMap<PDFDocumentProxy, Record<number, PDFPageProxy>>()
export const getPage = (doc: PDFDocumentProxy, pageIndex: number): Promise<PDFPageProxy> => {
  if (!doc) {
    return Promise.reject('Document not loaded yet')
  }
  const page = pagesMap.get(doc)?.[pageIndex]
  if (page) {
    return Promise.resolve(page)
  }
  return new Promise(resolve => {
    doc.getPage(pageIndex + 1).then(page => {
      pagesMap.set(doc, { ...pagesMap.get(doc), [pageIndex]: page })
      resolve(page)
    })
  })
}
