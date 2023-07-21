import { Viewer } from './core'
import { FC, memo, useCallback, useEffect, useRef, useState } from 'react'
import PdfPage from './components/page/Page'
import styles from './index.module.less'
import { IAnnotation, IPdfInstance, IPdfViewer, RenderPageProps } from '~/typings'
import { AnnotationType } from './core/types/annotation'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { useMemoizedFn, useMergedRef } from '@/hooks'
import { Range } from '@tanstack/react-virtual'
import Link from './components/annotation/Link'
import usePdfDrag from './hooks/usePdfDrag'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { ID_TO_LABEL_MAP } from './weakMaps'
import usePdfViewer from './core/hooks/useViewer'
import { ObjectStore } from '@/stores'
import { SearchStore } from '@/stores/search.store'
import { savePdfAsSearch } from '@/stores/document.store'
import { waitFor } from '@/utils/functions'
import PdfFloatBar from './components/floatbar'

interface PdfViewerProps {
  documentId: number
  transformScale?: number
  onViewerInitialized?: (viewer: IPdfViewer) => void
  onInstanceInitialized?: (i: IPdfInstance) => void
}
export const PdfViewer: FC<PdfViewerProps> = memo(({ documentId, transformScale, onInstanceInitialized }) => {
  const documentAtom = ObjectStore('pdf').createAtom(documentId)
  const document = useGlobalAtomValue(documentAtom)
  const viewerRef = useRef()
  const viewer = usePdfViewer()
  const mergedRef = useMergedRef(viewerRef)
  const [contextMenuVisible, setContextMenuVisible] = useState(false)

  // ref to store pdf viewer instance
  const viewboxRef = useRef<HTMLDivElement>(null)
  // ref to store pdf document
  const documentRef = useRef<PDFDocumentProxy>()
  // context event emitter

  usePdfDrag(viewboxRef.current, documentId)
  useEffect(() => {
    ID_TO_LABEL_MAP.set(viewer, new Map())
    waitFor(
      () => !!viewer.jumpToLabel,
      () => {
        onInstanceInitialized?.(viewer)
      }
    )
  }, [])

  const handleOpenMenu = useCallback(e => {
    e.preventDefault()
    setContextMenuVisible(true)
  }, [])

  useEffect(() => {
    viewboxRef.current?.addEventListener('contextmenu', handleOpenMenu)
    return () => {
      viewboxRef.current?.removeEventListener('contextmenu', handleOpenMenu)
    }
  })

  const renderPage = useCallback(
    (props: RenderPageProps) => (documentId ? <PdfPage pdfId={documentId} key={props.pageIndex} {...props} /> : null),
    [documentId]
  )
  const handleRangeChange = useMemoizedFn((range?: Range) => {
    if (range) {
      const progress = range?.progress || 0
      ObjectStore('pdf').updateOne(
        {
          id: documentId,
          readProgress: progress,
          lastReadPage: range.startIndex,
          lastReadAt: Date.now()
        },
        { silent: true }
      )
    }
  })

  const renderAnnotation = useCallback((annotation: IAnnotation) => {
    switch (annotation.annotationType) {
      case AnnotationType.Link:
        return (
          <Link
            onClick={() => {
              annotation.dest && viewer.jumpToDest?.(annotation.dest)
            }}
          />
        )
    }
  }, [])
  return (
    <div ref={viewboxRef} className={styles.viewerBox} role="pdf-viewer">
      {document?.fileUrl && (
        <Viewer
          onDocumentLoaded={doc => {
            documentRef.current = doc
            SearchStore.existTargetObjectDocuments(documentId).then(res => {
              if (!res) {
                doc.getData().then(data => {
                  savePdfAsSearch(data, documentId)
                })
              }
            })
          }}
          layoutClassName={styles.viewerLayout}
          innerRef={mergedRef}
          fileUrl={document.fileUrl}
          renderPage={renderPage}
          renderAnnotation={renderAnnotation}
          onRangeChange={handleRangeChange}
          initialPage={document?.lastReadPage}
          transformScale={transformScale}
        />
      )}
      <PdfFloatBar />
    </div>
  )
})
