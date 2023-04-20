import { PDFDocumentProxy } from 'pdfjs-dist'
import { IPdfViewer, ITextLayerInstance } from '~/typings'

export const PAGE_INDEX_TO_TEXT_LAYER = new WeakMap<IPdfViewer, Map<number, ITextLayerInstance>>()

export const PDF_TO_DOC = new WeakMap<IPdfViewer, PDFDocumentProxy>()

