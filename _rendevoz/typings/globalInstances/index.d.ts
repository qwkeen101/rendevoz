import { IGlobalTextSearchInstance } from './textSearch'
import { IGlobalTranslateInstance } from './translate'
import { IGlobalWebSearchInstance } from './webSearch'
import { IGlobalDragDropInstance } from './dragDrop'
import { IGlobalNoteImporterInstance } from './noteImporter'
import { IGlobalUtilsInstance } from './utils'
import { IGlobalPdfPrinterInstance } from './pdfPrinter'
import { IGlobalScreenshotInstance } from './screenshot'
export declare namespace GlobalInstances {
  export type TranslateInstance = IGlobalTranslateInstance
  export type WebSearchInstance = IGlobalWebSearchInstance
  export type TextSearchInstance = IGlobalTextSearchInstance
  export type DragDropInstance = IGlobalDragDropInstance
  export type NoteImporterInstance = IGlobalNoteImporterInstance
  export type GlobalUtilsInstance = IGlobalUtilsInstance
  export type PdfPrinterInstance = IGlobalPdfPrinterInstance
  export type ScreenshotInstance = IGlobalScreenshotInstance
}

export * from './dragDrop'
