import { IAISearchSource } from '~/typings'
import worker from '@/api/common/extractPdfTextWorker?worker'
import turndown from 'turndown'
const converter = new turndown()
converter.addRule('removeLinkUrl', {
  filter: 'a',
  replacement: c => c
})
converter.addRule('removeImgUrl', {
  filter: 'img',
  replacement: (content, node) => (node as HTMLImageElement).alt || ''
})
converter.remove(['head', 'script', 'noscript', 'iframe', 'img', 'audio', 'video', 'style', 'textarea', 'input'])

export default async (source: IAISearchSource): Promise<string | undefined> => {
  if (source.pdfDownloadUrl) {
    const w = new worker()
    w.postMessage(source.pdfDownloadUrl)
    return await new Promise(res => {
      w.onmessage = m => {
        res(m.data)
        w.terminate()
      }
    })
  } else {
    const url = source.url
    const html = await Global.utils.fetchURL(url)
    const extracted = Global.utils.extractHTML(url, html).extracted.documentElement.outerHTML
    const markdown = converter.turndown(extracted)
    return markdown
  }
}
