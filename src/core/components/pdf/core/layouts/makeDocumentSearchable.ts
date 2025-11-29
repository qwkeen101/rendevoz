import { PDFDocumentProxy } from 'pdfjs-dist'
import { IPDFInstance, TextItem } from '~/typings'
import { normalizeText } from '@/core/components/pdf/core/utils/search'
import Id from '@/utils/id'

export default (doc: PDFDocumentProxy, instance: IPDFInstance) => {
  const texts = instance.values.texts
  instance.values.textsLoaded = false
  const currentPage = {
    current: 0
  }
  const aborted = {
    current: false
  }
  const asyncLoopTextContent = () => {
    if (aborted.current) return
    if (currentPage.current === doc.numPages) {
      instance.values.textsLoaded = true
      return
    }
    doc
      .getPage(currentPage.current + 1)
      .then(async page => {
        const t = await page.getTextContent()
        page.cleanup()
        return t
      })
      .then(item => {
        if (aborted.current) return
        const hasStrTexts = item.items.filter(i => (i as TextItem).str) as TextItem[]
        const str = hasStrTexts
          .map(i => {
            if (i.hasEOL) {
              return i.str + ' '
            }
            return i.str
          })
          .join('')
        const normalized = normalizeText(str)

        const id = Id.getId()
        texts.push({
          id,
          str: normalized,
          page: currentPage.current
        })
        currentPage.current += 1
        requestIdleCallback(() => asyncLoopTextContent())
      })
  }
  asyncLoopTextContent()
  return () => {
    aborted.current = true
  }
}
