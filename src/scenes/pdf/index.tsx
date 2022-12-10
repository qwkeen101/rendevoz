import Container from '@/components/base/container'
import Sidebar from '@/components/pdf/components/sidebar'
import { PdfViewer } from '@/components/pdf/PdfViewer'
import useCurrentViewingPdf from '@/hooks/components/useCurrentViewingPdf'
import { ipcInstance } from '@/plugins'
import useDocumentStore from '@/stores/document.store'
import { FC, useState } from 'react'
import PdfPageHeader from './Header'
import { Content } from '@/components'
import { Provider } from 'jotai'
import { PdfScope } from '@/jotai/jotaiScope'
import { useIsomorphicLayoutEffect } from 'react-use'
import TabTitle from '@/components/layout/TabTitle'

const PdfPage: FC<{
  pdfId: number
}> = ({ pdfId }) => {
  const { documents } = useDocumentStore()
  const [, setCurrentViewingPdf] = useCurrentViewingPdf()
  const [fileUrl, setFileUrl] = useState()

  useIsomorphicLayoutEffect(() => {
    if (!fileUrl) {
      const fileUrl = documents.get(pdfId)?.fileUrl
      ipcInstance.send('readPdf', fileUrl).then(res => {
        setFileUrl(res.data)
      })
      setCurrentViewingPdf(documents.get(pdfId))
    }
  }, [documents, pdfId])
  const document = documents.get(pdfId)
  return (
    <>
      <TabTitle title={document?.metadata?.title || document?.name}/>
      <Provider scope={PdfScope}>
        <Container auto>
          <Content flex column fullHeight fullWidth>
            <PdfPageHeader />
            <Content flex centered>
              <PdfViewer fileUrl={fileUrl} document={document} />
              <Sidebar />
            </Content>
          </Content>
        </Container>
      </Provider>
    </>
  )
}
export default PdfPage
