import { Viewer } from './core'
import { FC, memo,  useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PdfPage from './components/page/Page'
import styles from './index.module.less'
import { RenderPageProps, IAnnotation, IPdfViewer } from '~/typings'
import { AnnotationType } from './core/types/annotation'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { useMemoizedFn, useMergedRef } from '@/hooks'
import createDocumentStore, { documentsAtom } from '@/stores/document.store'
import { usePdfId } from './hooks/usePdfInfo'
import { Range } from '@tanstack/react-virtual'
import Link from './components/annotation/Link'
import usePdfDrag from './hooks/usePdfDrag'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { selectAtom } from 'jotai/utils'
import createPdfViewer from './core/createPdfViewer'
import { ID_TO_LABEL_MAP } from './weakMaps'
import { useStore } from 'jotai'
import { PdfViewerAtom } from './core/hooks/useViewer'

interface PdfViewerProps {
  documentId: number
  transformScale?: number
  onViewerInitialized?: (viewer: IPdfViewer) => void
}
export const PdfViewer: FC<PdfViewerProps> = memo(({ documentId, transformScale, onViewerInitialized }) => {
  const documentAtom = useMemo(() => selectAtom(documentsAtom, d => d.get(documentId)), [documentId])
  const document = useGlobalAtomValue(documentAtom)
  const [, setPdfId] = usePdfId()
  const viewerRef = useRef()
  const mergedRef = useMergedRef(viewerRef)
  const store = useStore()
  const [contextMenuVisible, setContextMenuVisible] = useState(false)

  const { updateDocument } = createDocumentStore()
  // ref to store pdf viewer instance
  const viewboxRef = useRef<HTMLDivElement>(null)
  // ref to store pdf document
  const documentRef = useRef<PDFDocumentProxy>()
  // context event emitter

  usePdfDrag(viewboxRef.current, documentId)
  const viewer = useMemo(() => {
    const viewer = createPdfViewer()
    store.set(PdfViewerAtom, viewer)
    ID_TO_LABEL_MAP.set(viewer, new Map())
    const currTime = Date.now()
    const checkViewerInitialize = () => {
      const checkTime = Date.now()
      // total wait time 10 seconds
      if (checkTime - currTime > 10000) {
        return
      }
      if (Object.keys(viewer).length > 0) {
        onViewerInitialized?.(viewer)
      } else {
        requestAnimationFrame(checkViewerInitialize)
      }
    }
    checkViewerInitialize()
    return viewer
  }, [])

  const handleOpenMenu = useCallback(e => {
    e.preventDefault()
    setContextMenuVisible(true)
  }, [])
  useEffect(() => {
    setPdfId(documentId)
  }, [documentId])

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
      updateDocument(
        {
          id: documentId,
          readProgress: progress,
          lastReadPage: range.startIndex,
          lastReadAt: Date.now()
        },
        true
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
    <div ref={viewboxRef} className={styles.viewerBox}>
      {document?.fileUrl && (
        <Viewer
          viewer={viewer}
          onDocumentLoaded={doc => (documentRef.current = doc)}
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
    </div>
  )
})
