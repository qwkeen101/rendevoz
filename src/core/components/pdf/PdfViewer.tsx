import { Viewer } from './core'
import { FC, memo, useCallback, useEffect, useRef, useState } from 'react'
import PdfPage from './components/page/Page'
import styles from './index.module.less'
import { IAnnotation, IPdfInstance, IPdfViewer, RenderPageProps } from '~/typings'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { useMemoizedFn } from '@/hooks'
import { Range } from '@tanstack/react-virtual'
import Link from './components/annotation/Link'
import usePdfDrag from './hooks/usePdfDrag'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { ID_TO_LABEL_MAP } from './weakMaps'
import { MetaStore, ObjectStore } from '@/api/stores'
import { waitFor } from '@/utils/functions'
import DownloadRemotePdf from '@/core/components/pdf/core/utils/downloadRemotePdf'
import { DownloadProgress, formatBytes } from '@/utils/fetchProcess'
import { Content } from '@/components'
import { Colors } from '@/consts'
import PdfHeader from '@/core/components/pdf/components/PdfHeader'
import LabelToolbarRenderer from '@/core/components/pdf/components/label/LabelToolbarRenderer'
import usePdfInstance from '@/core/components/pdf/hooks/usePdfInstance'

export interface PdfViewerProps {
  documentId: number
  transformScale?: number
  onViewerInitialized?: (viewer: IPdfViewer) => void
  onInstanceInitialized?: (i: IPdfInstance) => void
}
export const PdfViewer: FC<PdfViewerProps> = memo(({ documentId, transformScale, onInstanceInitialized }) => {
  const documentAtom = ObjectStore('pdf').createAtom(documentId)
  const document = useGlobalAtomValue(documentAtom)
  const documentMeta = MetaStore.useObjectToMetaValue(documentId)
  const viewer = usePdfInstance()
  const [downloadState, setDownloadState] = useState<DownloadProgress>()

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
      DownloadRemotePdf(document.webFileUrl, p => {
        setDownloadState(p)
      }).then(data => {
        ObjectStore('pdf').updateOne({ id: documentId, url: data })
        setDownloadState(undefined)
      })
    }
    ID_TO_LABEL_MAP.set(viewer, new Map())
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
      const progress = range?.progress || 0
      ObjectStore('pdf').updateOne(
        {
          id: documentId,
          readProgress: progress,
          lastReadPage: range.currentIndex,
          lastReadAt: Date.now()
        },
        { silent: true }
      )
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
    <div ref={viewboxRef} className={styles.viewerBox} role="pdf-viewer">
      <PdfHeader documentId={documentId} />
      <LabelToolbarRenderer />
      {downloadState && (
        <Content flex column alignItems={'center'} fullWidth justifyContent={'center'} gap={10}>
          <div
            style={{ width: 'min(800px, 60%)', height: 6, borderRadius: 999, overflow: 'hidden', background: Colors.Background.Secondary }}
          >
            <div
              style={{
                height: '100%',
                width: `${downloadState.percentage}%`,
                background: Colors.Common.SelectColor
              }}
            ></div>
          </div>
          <div>Remaining: {formatBytes(downloadState.remaining, 0)}</div>
        </Content>
      )}
      {document?.url && (
        <Viewer
          onDocumentLoaded={doc => {
            documentRef.current = doc
            ObjectStore('pdf').updateOne({ id: documentId, totalPageNum: doc.numPages })
          }}
          layoutClassName={styles.viewerLayout}
          fileUrl={document.url}
          renderPage={renderPage}
          renderAnnotation={renderAnnotation}
          onRangeChange={handleRangeChange}
          initialPage={document?.lastReadPage}
          transformScale={transformScale}
        />
      )}
    </div>
  )
})
