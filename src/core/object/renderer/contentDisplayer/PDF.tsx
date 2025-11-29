import Pdf from '@/core/components/pdf'
import { ObjectStore } from '@/api/stores'
import { memo } from 'react'

const PDFDisplayer = memo(({ id }: { id: number }) => {
  const PDF = ObjectStore('pdf').useValue(id)
  return (
    <Pdf
      pdfId={id}
      fileUrl={PDF?.url}
      layout={{ showHeader: false }}
      state={{
        enableSearch: false
      }}
      styles={{ pageGap: 5, minPagePadding: 8, pageBoxShadowName: 'var(--border-box-shadow)' }}
      autoWidth={true}
    />
  )
})
export default PDFDisplayer
