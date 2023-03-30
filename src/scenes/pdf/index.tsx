import { PdfViewer } from '@/core'
import { documentsAtom } from '@/stores/document.store'
import { FC, memo, useMemo } from 'react'
import PdfPageHeader from './Header'
import { Content, Container } from '@/components'
import { Provider } from 'jotai'
import { createStore } from 'jotai/vanilla'
import TabTitle from '@/components/layout/TabTitle'
import PdfFloatBar from './FloatBar/FloatBar'
import { selectAtom } from 'jotai/utils'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { IPdfViewer } from '~/typings'

const PdfPage: FC<{
  pdfId: number
  onViewerInitialized?: (viewer: IPdfViewer) => void
}> = memo(({ pdfId, onViewerInitialized }) => {
  const documentAtom = useMemo(() => selectAtom(documentsAtom, d => d.get(pdfId)), [pdfId])
  const document = useGlobalAtomValue(documentAtom)

  const store = useMemo(() => createStore(), [])

  return (
    <>
      <TabTitle title={document?.metadata?.title || document?.name || 'Unknown book'} />
      <Container auto>
        <Provider store={store}>
          <Content flex column fullHeight fullWidth>
            <PdfPageHeader document={document} />
            <Content flex centered fullHeight>
              <PdfFloatBar document={document} />
              <PdfViewer documentId={pdfId} onViewerInitialized={onViewerInitialized} />
            </Content>
          </Content>
        </Provider>
      </Container>
    </>
  )
})
export default PdfPage
