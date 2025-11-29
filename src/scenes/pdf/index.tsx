import { FC, memo } from 'react'
import { Container } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import { IPDFInstance } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import UncontrolledPDF from '@/core/components/pdf/UncontrolledPDF'

const PdfPage: FC<{
  pdfId: number
  onInstanceInitialized?: (i: IPDFInstance) => void
  disableTitle?: boolean
}> = memo(({ pdfId, onInstanceInitialized, disableTitle }) => {
  const document = ObjectStore('pdf').useValue(pdfId)
  const pdfMeta = MetaStore.useObjectToMetaValue(pdfId)
  return (
    <>
      {!disableTitle && (
        <TabTitle title={pdfMeta?.name || document?.metadata?.title || document?.name} icon={Global.utils.getIcon('pdf')} />
      )}
      <Container auto>
        <UncontrolledPDF id={pdfId} onInstanceInitialized={onInstanceInitialized} />
      </Container>
    </>
  )
})
export default PdfPage
