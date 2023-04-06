import { PdfViewer } from '@/core'
import { FC, memo, useMemo } from 'react'
import PdfPageHeader from './Header'
import { Content, Container } from '@/components'
import { Provider } from 'jotai'
import { createStore } from 'jotai/vanilla'
import TabTitle from '@/components/layout/TabTitle'
import PdfFloatBar from './FloatBar/FloatBar'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { IPdfViewer } from '~/typings'
import { ObjectStore } from '@/stores'

const PdfPage: FC<{
  pdfId: number
  onViewerInitialized?: (viewer: IPdfViewer) => void
  disableTitle?: boolean
}> = memo(({ pdfId, onViewerInitialized, disableTitle }) => {
  const documentAtom = ObjectStore('pdf').createAtom(pdfId)
  const document = useGlobalAtomValue(documentAtom)

  const store = useMemo(() => createStore(), [])

  return (
    <>
      {!disableTitle && <TabTitle title={document?.metadata?.title || document?.name || 'Unknown book'} icon="park-file-pdf" />}
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
