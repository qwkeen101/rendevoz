import Container from '@/components/base/container'
import { PdfViewer } from '@/components/pdf/PdfViewer'
import { documentsAtom } from '@/stores/document.store'
import { FC, memo, useMemo, useRef } from 'react'
import PdfPageHeader from './Header'
import { Content } from '@/components'
import { Provider } from 'jotai'
import { createStore } from 'jotai/vanilla'
import TabTitle from '@/components/layout/TabTitle'
import PdfFloatBar from './FloatBar/FloatBar'
import { ViewerContext } from './useViewer'
import { selectAtom } from 'jotai/utils'
import { useGlobalAtomValue } from '@/jotai/jotaiScope'
import { IPdfViewer } from '@/pdfViewer/core/types/pdfViewer'

const PdfPage: FC<{
  pdfId: number
  onViewerInitialized?: (viewer: IPdfViewer) => void
}> = memo(({ pdfId, onViewerInitialized }) => {
  const documentAtom = useMemo(() => selectAtom(documentsAtom, d => d.get(pdfId)), [pdfId])
  const document = useGlobalAtomValue(documentAtom)
  const innerRef = useRef(null)
  const store = useMemo(() => createStore(), [])

  return (
    <>
      <TabTitle title={document?.metadata?.title || document?.name || 'Unknown book'} />
      <Container auto>
        <ViewerContext.Provider value={innerRef}>
          <Provider store={store}>
            <Content flex column fullHeight fullWidth>
              <PdfPageHeader document={document} />
              <Content flex centered fullHeight>
                <PdfFloatBar document={document}/>
                <PdfViewer innerRef={innerRef} documentId={pdfId} onViewerInitialized={onViewerInitialized} />
              </Content>
            </Content>
          </Provider>
        </ViewerContext.Provider>
      </Container>
    </>
  )
})
export default PdfPage
