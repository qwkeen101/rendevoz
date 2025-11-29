import * as PdfJS from 'pdfjs-dist'
import PdfJsUrl from '@/assets/pdf.worker.mjs?url'
import { range } from 'lodash'
PdfJS.GlobalWorkerOptions.workerSrc = PdfJsUrl

self.onmessage = async e => {
  const buffer = await fetch(e.data as string).then(i => i.arrayBuffer())
  const doc = await PdfJS.getDocument(buffer).promise
  const pages = doc.numPages
  const text = (
    await Promise.all(
      range(1, pages).map(async i => {
        const page = await doc.getPage(i)
        const text = await page.getTextContent()
        return text.items.map(i => i.str as string).join(' ')
      })
    )
  ).join('\n')
  self.postMessage(text)
}
