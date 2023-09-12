import { Range } from '@tanstack/react-virtual'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC, ReactElement } from 'react'
import Layout from './layouts/Layout'
import LayoutWrapper from './layouts/LayoutWrapper'
import Loader from './Loader'
import { RenderPageProps } from './types'
import { IAnnotation } from '~/typings'
import { ScrollMode } from './types/layout'

interface ViewerProps {
  fileUrl: string | Uint8Array
  initialPage?: number
  scrollMode?: ScrollMode
  renderPage?: (props: RenderPageProps) => ReactElement
  renderAnnotation?: (annotation: IAnnotation) => ReactElement
  layoutClassName?: string
  innerRef: any
  onDocumentLoaded?: (doc: PDFDocumentProxy) => void
  onRangeChange?: (range: Range) => void
  transformScale?: number
}

export const Viewer: FC<ViewerProps> = ({
  fileUrl,
  initialPage = 0,
  scrollMode = 'vertical',
  renderPage,
  renderAnnotation,
  innerRef,
  layoutClassName,
  onDocumentLoaded,
  onRangeChange,
  transformScale
}) => {
  return (
    <Loader onDocumentLoaded={onDocumentLoaded} file={fileUrl}>
      {doc => (
        <LayoutWrapper doc={doc}>
          {pageSize => (
            <Layout
              transformScale={transformScale}
              className={layoutClassName}
              renderPage={renderPage}
              innerRef={innerRef}
              onRangeChange={onRangeChange}
              renderAnnotation={renderAnnotation}
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

export { default as Loader } from './Loader'
