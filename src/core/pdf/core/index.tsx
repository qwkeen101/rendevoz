import { Range } from '@tanstack/react-virtual'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC, ReactElement, useEffect, useMemo } from 'react'
import Layout from './layouts/Layout'
import LayoutWrapper from './layouts/LayoutWrapper'
import Loader from './Loader'
import { RenderPageProps } from './types'
import { IAnnotation } from '~/typings'
import { ScrollMode } from './types/layout'
import { createStore, Provider } from 'jotai'
import { IPdfViewer } from './types/pdfViewer'
import { PdfViewerAtom } from './hooks/useViewer'

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
  viewer: IPdfViewer
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
  transformScale,
  viewer
}) => {
  const store = useMemo(() => {
    const store = createStore()
    store.set(PdfViewerAtom, viewer)
    return store
  }, [])

  return (
    <Provider store={store}>
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
    </Provider>
  )
}

export { default as Loader } from './Loader'
