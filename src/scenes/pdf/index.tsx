import { FC, memo } from 'react'
import { Container } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import { IPdfInstance } from '~/typings'
import { ObjectStore } from '@/api/stores'
import Pdf from '@/core/pdf'
import { Rendevoz } from '@/core/rendevoz'

const PdfPage: FC<{
  pdfId: number
  onInstanceInitialized?: (i: IPdfInstance) => void
  disableTitle?: boolean
}> = memo(({ pdfId, onInstanceInitialized, disableTitle }) => {
  const document = ObjectStore('pdf').useValue(pdfId)
  return (
    <>
      {!disableTitle && (
        <TabTitle
          title={document?.metadata?.title || document?.name || 'Unknown book'}
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
