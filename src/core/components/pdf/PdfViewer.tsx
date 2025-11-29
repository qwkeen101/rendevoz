import { Viewer } from './core'
import { FC, memo, useContext, useEffect, useRef, useState } from 'react'
import { IPDFAiSummary, IPdfDocument, IPDFEvent, IPDFInstance, ISubChat } from '~/typings'
import { MetaStore } from '@/api/stores'
import { waitFor } from '@/utils/functions'
import Header from '@/core/components/pdf/components/Header'
import LabelToolbarRenderer from '@/core/components/pdf/components/label/LabelToolbarRenderer'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { useSetAtom } from 'jotai'
import { PDFStateAtom } from '@/core/components/pdf/hooks/usePDFState'
import QuickLabelPopover from '@/core/components/pdf/components/label/QuickLabelPopover'
import usePDFLabels from '@/core/components/pdf/hooks/usePDFLabels'
import PDFSearch from '@/core/components/pdf/components/Search'
import PageConfigContext from '@/core/components/PageConfigContext'
import { useMeasure } from '@/hooks'

export interface PdfViewerProps {
  documentId: number
  transformScale?: number
  onInstanceInitialized?: (i: IPDFInstance) => void
  autoWidth?: boolean
  fileUrl?: string
  styles?: {
    minPagePadding?: number
    pageGap?: number
    pdfMaxWidth?: number
    pageBoxShadowName?: string
  }
  state?: {
    enableSearch?: boolean
    scale?: number
    doublePage?: boolean
    rememberScrollPosition?: boolean
    initialPage?: number
    name?: string
    aiSummary?: IPDFAiSummary
    aiChat?: ISubChat
    labelIds?: number[]
    metaId?: number
    exam?: number
  } & Pick<
    IPdfDocument,
    | 'labelScrollOffset'
    | 'labelFolders'
    | 'labelPriority'
    | 'labelFilter'
    | 'labelSortMode'
    | 'defaultActiveSidebar'
    | 'defaultSidebarVisible'
  >
  layout?: {
    showHeader?: boolean
  }
  on?: (e: IPDFEvent) => void
}
export const PdfViewer: FC<PdfViewerProps> = memo(
  ({ documentId, transformScale, onInstanceInitialized, layout, styles: outerStyles, autoWidth, on, state, fileUrl }) => {
    const documentMeta = MetaStore.useObjectToMetaValue(documentId)
    const viewer = usePDFInstance()
    const pageConfig = useContext(PageConfigContext)
    usePDFLabels(documentId)
    viewer.on = on
    viewer.getContainerElement = () => viewboxRef.current!
    const setPDFState = useSetAtom(PDFStateAtom)
    useEffect(() => setPDFState(s => ({ ...s, styles: outerStyles, layout, autoWidth, state })), [outerStyles, layout, autoWidth, state])
    const viewboxRef = useRef<HTMLDivElement>(null)
    const { width } = useMeasure(viewboxRef)
    // context event emitter
    useEffect(() => {
      if (documentMeta && !documentMeta.coverImgSrc) {
        setTimeout(() => {
          viewer.capturePageImage?.(0).then(s => {
            MetaStore.updateMetaObject({ id: documentMeta.id, coverImgSrc: s })
          })
        }, 100)
      }
    }, [documentMeta])
    useEffect(() => {
      waitFor(
        () => !!viewer.getPageSize,
        () => {
          if (documentMeta && !documentMeta.coverImgSrc) {
            setTimeout(() => {
              viewer.capturePageImage?.(0).then(s => {
                MetaStore.updateMetaObject({ id: documentMeta.id, coverImgSrc: s })
              })
            }, 100)
          }
          onInstanceInitialized?.(viewer)
        }
      )
    }, [])
    return (
      <div ref={viewboxRef} className={'w-full h-full relative overflow-hidden flex flex-col bg-secondary'}>
        {layout?.showHeader !== false && pageConfig.pdfHeader !== false && <Header />}
        <LabelToolbarRenderer />
        <QuickLabelPopover />
        <PDFSearch />
        {fileUrl && (
          <Viewer
            containerWidth={Math.floor(width)}
            onDocumentLoaded={doc => {
              setPDFState(s => ({ ...s, numPages: doc.numPages }))
            }}
            fileUrl={fileUrl}
            thumbnailWorker={layout?.showHeader !== false}
            initialPage={state?.initialPage}
            transformScale={transformScale}
          />
        )}
      </div>
    )
  }
)
