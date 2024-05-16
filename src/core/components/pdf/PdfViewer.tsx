import { Viewer } from './core'
import { FC, memo, useCallback, useEffect, useRef, useState } from 'react'
import PdfPage from './components/page/Page'
import { IAnnotation, IPDFEvent, IPDFInstance, RenderPageProps } from '~/typings'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { useMemoizedFn } from '@/hooks'
import { Range } from '@tanstack/react-virtual'
import Link from './components/annotation/Link'
import usePdfDrag from './hooks/usePdfDrag'
import { MetaStore, ObjectStore } from '@/api/stores'
import { waitFor } from '@/utils/functions'
import DownloadRemotePdf from '@/core/components/pdf/core/utils/downloadRemotePdf'
import { Content } from '@/components'
import { Colors } from '@/consts'
import Header from '@/core/components/pdf/components/Header'
import LabelToolbarRenderer from '@/core/components/pdf/components/label/LabelToolbarRenderer'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { useSetAtom } from 'jotai'
import { PdfStateAtom } from '@/core/components/pdf/hooks/usePdfState'
import QuickLabelPopover from '@/core/components/pdf/components/label/QuickLabelPopover'

export interface PdfViewerProps {
  documentId: number
  transformScale?: number
  onInstanceInitialized?: (i: IPDFInstance) => void
  autoWidth?: boolean
  fileUrl?: string
  styles?: {
    paddingTop?: number
    pagePadding?: number
    paddingEnd?: number
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
  }
  layout?: {
    showHeader?: boolean
  }
  on?: (e: IPDFEvent) => void
}
export const PdfViewer: FC<PdfViewerProps> = memo(
  ({ documentId, transformScale, onInstanceInitialized, layout, styles: outerStyles, autoWidth, on, state, fileUrl }) => {
    const document = ObjectStore('pdf').useValue(documentId)
    const documentMeta = MetaStore.useObjectToMetaValue(documentId)
    const viewer = usePDFInstance()
    viewer.on = on
    const [downloadState, setDownloadState] = useState<{
      isDownloading?: boolean
      percent?: number
    }>()
    const setPDFState = useSetAtom(PdfStateAtom)
    useEffect(() => setPDFState(s => ({ ...s, styles: outerStyles, layout, autoWidth, state })), [outerStyles, layout, autoWidth, state])
    // ref to store pdf viewer instance
    const viewboxRef = useRef<HTMLDivElement>(null)
    // ref to store pdf document
    const documentRef = useRef<PDFDocumentProxy>()
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
    usePdfDrag(viewboxRef.current, documentId)
    useEffect(() => {
      if (document?.webFileUrl && !document.url) {
        setDownloadState({
          isDownloading: true,
          percent: 0
        })
        DownloadRemotePdf(document.webFileUrl, p => {
          setDownloadState({
            isDownloading: true,
            percent: p
          })
        })
          .then(data => {
            ObjectStore('pdf').updateOne({ id: documentId, url: data })
          })
          .finally(() => {
            setDownloadState(undefined)
          })
      }
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

    const handleOpenMenu = useCallback(e => {
      e.preventDefault()
    }, [])

    useEffect(() => {
      viewboxRef.current?.addEventListener('contextmenu', handleOpenMenu)
      return () => {
        viewboxRef.current?.removeEventListener('contextmenu', handleOpenMenu)
      }
    })

    const renderPage = useCallback(
      (props: RenderPageProps) =>
        documentId ? <PdfPage transformScale={transformScale} pdfId={documentId} key={props.pageIndex} {...props} /> : null,
      [documentId, transformScale]
    )
    const handleRangeChange = useMemoizedFn((range?: Range & { progress: number; currentIndex: number }) => {
      if (range) {
        on?.({
          type: 'readProgressChange',
          lastReadPage: range.currentIndex
        })
      }
    })

    const renderAnnotation = useCallback((annotation: IAnnotation) => {
      switch (annotation.annotationType) {
        case 2:
          return (
            <Link
              onClick={() => {
                if (annotation.url) {
                  window.open(annotation.url)
                }
                annotation.dest && viewer.navigateOps?.jumpToDest(annotation.dest)
              }}
            />
          )
      }
    }, [])
    return (
      <div ref={viewboxRef} className={'viewerBox'}>
        {layout?.showHeader !== false && <Header id={documentId} />}
        <LabelToolbarRenderer />
        <QuickLabelPopover />
        {downloadState?.isDownloading && (
          <Content flex column alignItems={'center'} fullWidth fullHeight justifyContent={'center'} gap={10}>
            <div className={'transparent-font'}>Downloading PDF...</div>
            <div
              style={{
                width: 'min(800px, 60%)',
                height: 6,
                borderRadius: 999,
                overflow: 'hidden',
                background: Colors.Background.Secondary
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(downloadState.percent ?? 0) * 100}%`,
                  background: Colors.Common.SelectColor
                }}
              ></div>
            </div>
          </Content>
        )}
        {fileUrl && (
          <Viewer
            onDocumentLoaded={doc => {
              documentRef.current = doc
              setPDFState(s => ({ ...s, numPages: doc.numPages }))
            }}
            fileUrl={fileUrl}
            renderPage={renderPage}
            renderAnnotation={renderAnnotation}
            onRangeChange={handleRangeChange}
            thumbnailWorker={layout?.showHeader !== false}
            initialPage={state?.initialPage}
            transformScale={transformScale}
          />
        )}
      </div>
    )
  }
)
