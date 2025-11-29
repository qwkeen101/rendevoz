import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC } from 'react'
import Layout from './layouts/Layout'
import LayoutWrapper from './layouts/LayoutWrapper'
import Loader from './Loader'
import { ScrollMode } from '~/typings'

interface ViewerProps {
  fileUrl: string | Uint8Array
  initialPage?: number
  scrollMode?: ScrollMode
  layoutClassName?: string
  onDocumentLoaded?: (doc: PDFDocumentProxy) => void
  transformScale?: number
  thumbnailWorker?: boolean
  containerWidth: number
}

export const Viewer: FC<ViewerProps> = ({
  fileUrl,
  initialPage = 0,
  thumbnailWorker,
  layoutClassName,
  onDocumentLoaded,
  transformScale,
  containerWidth
}) => {
  return (
    <Loader thumbnailWorker={thumbnailWorker} onDocumentLoaded={onDocumentLoaded} file={fileUrl}>
      {doc => (
        <LayoutWrapper containerWidth={containerWidth} doc={doc}>
          {pageSize => (
            <Layout
              transformScale={transformScale}
              className={layoutClassName}
              initialPage={initialPage}
              doc={doc}
              pageSize={pageSize}
            ></Layout>
          )}
        </LayoutWrapper>
      )}
    </Loader>
  )
}
export const DEFAULT_PDF_PAGE_GAP = 12
export { default as Loader } from './Loader'
