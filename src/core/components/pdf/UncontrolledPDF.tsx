import Pdf from '@/core/components/pdf/index'
import { MetaStore, ObjectStore } from '@/api/stores'
import { PdfViewerProps } from '@/core/components/pdf/PdfViewer'
import { memo, useEffect, useMemo } from 'react'
import { AI_SUMMARY_PROP_ID } from '@/api/stores/meta/meta.store'
import EmptyList from '@/core/components/common/EmptyList'

export default memo(({ id, ...rest }: { id: number } & Omit<PdfViewerProps, 'documentId'>) => {
  const pdf = ObjectStore('pdf').useValue(id)
  const updatePDF = ObjectStore('pdf').updateOne
  const pdfMeta = MetaStore.useObjectToMetaValue(id)
  useEffect(() => {
    if (pdf && !pdf.labels) {
      ObjectStore('pdf').updateOne({
        id,
        labels: []
      })
    }
  }, [pdf])
  const state = useMemo(
    () => ({
      metaId: pdfMeta?.id,
      labelIds: pdf?.labels,
      initialPage: pdf?.lastReadPage,
      name: pdfMeta?.name,
      doublePage: pdf?.doublePage,
      scale: pdf?.scale,
      aiChat: pdf?.aiChat,
      aiSummary: pdf?.aiSummary,
      labelFilter: pdf?.labelFilter,
      labelPriority: pdf?.labelPriority,
      labelScrollOffset: pdf?.labelScrollOffset,
      labelSortMode: pdf?.labelSortMode,
      labelFolders: pdf?.labelFolders,
      defaultActiveSidebar: pdf?.defaultActiveSidebar,
      defaultSidebarVisible: pdf?.defaultSidebarVisible,
      exam: pdf?.exam,
      ...rest.state
    }),
    [pdf, rest.state, pdfMeta?.id, pdfMeta?.name]
  )
  if (pdf) {
    return (
      <Pdf
        {...rest}
        pdfId={id}
        fileUrl={pdf?.url}
        autoWidth={rest.autoWidth ?? true}
        state={state}
        on={e => {
          switch (e.type) {
            case 'removeSummary': {
              updatePDF({ id, aiSummary: undefined })
              const pdfMeta = MetaStore.getMetaObjectByObjectId(id)
              if (pdfMeta) {
                MetaStore.property.updateProperty(pdfMeta.id, AI_SUMMARY_PROP_ID, null)
              }
              break
            }
            case 'stateChange':
              updatePDF({ id, ...e.state })
              break
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
  }
  return <EmptyList className={'h-full flex-1'} />
})
