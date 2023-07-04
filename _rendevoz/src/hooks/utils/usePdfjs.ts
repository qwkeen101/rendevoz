import * as PdfJS from 'pdfjs-dist'

const usePdfjs = () => {
  const PdfJs = window['pdfjs-dist/build/pdf']
  return PdfJs as typeof PdfJS
}
export default usePdfjs
