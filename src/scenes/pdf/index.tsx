import Container from '@/components/base/container'
import { PdfViewer } from '@/components/pdf/PdfViewer'
import useCurrentViewingPdf from '@/hooks/components/useCurrentViewingPdf'
import { ipcInstance } from '@/plugins'
import { documentsAtom } from '@/stores/document.store'
import { FC, memo, useMemo, useRef, useState } from 'react'
import PdfPageHeader from './Header'
import { Content } from '@/components'
import { Provider } from 'jotai'
import { atom } from 'jotai/vanilla'
import { useAtomValue } from 'jotai/react'
import { PdfScope } from '@/jotai/jotaiScope'
import { useIsomorphicLayoutEffect } from 'react-use'
import TabTitle from '@/components/layout/TabTitle'
import PdfFloatBar from './FloatBar/FloatBar'
import { globalStore } from '@/stores/stores'
import { ViewerContext } from './useViewer'

const PdfPage: FC<{
  pdfId: number
}> = memo(({ pdfId }) => {
  const [, setCurrentViewingPdf] = useCurrentViewingPdf()
  const [fileUrl, setFileUrl] = useState()
  const documentAtom = useMemo(() => atom(get => get(documentsAtom).get(pdfId)), [pdfId])
  const document = useAtomValue(documentAtom, { store: globalStore })
  const innerRef = useRef(null)
  useIsomorphicLayoutEffect(() => {
    if (!fileUrl) {
      const fileUrl = globalStore.get(documentsAtom).get(pdfId)?.fileUrl
      ipcInstance.send('readPdf', fileUrl).then(res => {
        setFileUrl(res.data)
      })
      setCurrentViewingPdf(document)
    }
  }, [document])

  return (
    <>
      <TabTitle title={document?.metadata?.title || document?.name || 'Unknown book'} />

      <Container auto>
        <ViewerContext.Provider value={innerRef}>
          <Provider scope={PdfScope}>
            <Content flex column fullHeight fullWidth>
              <PdfPageHeader />
              <Content flex centered>
                <PdfFloatBar />
                <PdfViewer innerRef={innerRef} fileUrl={fileUrl} document={document} />
              </Content>
            </Content>
          </Provider>
        </ViewerContext.Provider>
      </Container>
    </>
  )
})
export default PdfPage
