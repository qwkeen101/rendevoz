import Pdf from '@/core/components/pdf/index'
import { ObjectStore } from '@/api/stores'
import { PdfViewerProps } from '@/core/components/pdf/PdfViewer'
import { useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'
import { memo } from 'react'

export default memo(({ id, ...rest }: { id: number } & Omit<PdfViewerProps, 'documentId'>) => {
  const pdf = ObjectStore('pdf').useValue(id)
  const updatePDF = ObjectStore('pdf').updateOne
  const autoWidth = useSelectGlobalAtomValue(SettingAtom, s => s.pdf.autoWidth)
  console.log(pdf?.scale)
  return (
    <Pdf
      {...rest}
      pdfId={id}
      fileUrl={pdf?.url}
      autoWidth={rest.autoWidth ?? autoWidth}
      state={{ initialPage: pdf?.lastReadPage, doublePage: pdf?.doublePage, scale: pdf?.scale, ...rest.state }}
      on={e => {
        switch (e.type) {
          case 'doublePage': {
            updatePDF({ id, doublePage: e.value })
            break
          }
          case 'readProgressChange': {
            updatePDF({ id, lastReadPage: e.lastReadPage })
            break
          }
          case 'scaleChange': {
            updatePDF({ id, scale: e.value })
            break
          }
        }
      }}
    />
  )
})
