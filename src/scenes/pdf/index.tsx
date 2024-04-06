import { FC, memo } from 'react'
import { Container } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import { IPdfInstance } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import Pdf from '@/core/components/pdf'
import { Rendevoz } from '@/core/rendevoz'

const PdfPage: FC<{
  pdfId: number
  onInstanceInitialized?: (i: IPdfInstance) => void
  disableTitle?: boolean
}> = memo(({ pdfId, onInstanceInitialized, disableTitle }) => {
  const document = ObjectStore('pdf').useValue(pdfId)
  const pdfMeta = MetaStore.useObjectToMetaValue(pdfId)
  return (
    <>
      {!disableTitle && (
        <TabTitle
          title={pdfMeta?.name || document?.metadata?.title || document?.name || 'Unknown PDF'}
          icon={Rendevoz.Utils.Object.getMetaObjectIcon('pdf')}
        />
      )}
      <Container auto>
        <Pdf pdfId={pdfId} onInstanceInitialized={onInstanceInitialized} />
      </Container>
    </>
  )
})
export default PdfPage
