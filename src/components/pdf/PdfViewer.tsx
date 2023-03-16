import Viewer from '@/pdfViewer/core/Viewer'
import { FC, memo, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PdfPage from './components/page/Page'
import styles from './index.module.less'
import { RenderPageProps } from '@/pdfViewer/core/types'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { useMemoizedFn, useMergedRef } from '@/hooks'
import createDocumentStore, { documentsAtom } from '@/stores/document.store'
import { usePdfId } from './hooks/usePdfInfo'
import { Range } from '@tanstack/react-virtual'
import { AnnotationType, IAnnotation } from '@/pdfViewer/core/types/annotation'
import Link from './components/annotation/Link'
import usePdfDrag from './hooks/usePdfDrag'
import { GlobalInstances, PdfInstance } from '../layout'
import { LayoutFunctions } from '@/pdfViewer/core/layouts/Layout'
import { useGlobalAtomValue } from '@/jotai/jotaiScope'
import { selectAtom } from 'jotai/utils'
import createPdfViewer from '@/pdfViewer/core/createPdfViewer'
import { IPdfViewer } from '@/pdfViewer/core/types/pdfViewer'
import { ID_TO_LABEL_MAP } from './weakMaps'
import { useStore } from 'jotai'
import { PdfViewerAtom } from '@/pdfViewer/core/hooks/useViewer'

interface PdfViewerProps {
  documentId: number
  innerRef?: RefObject<LayoutFunctions>
  transformScale?: number
  onViewerInitialized?: (viewer: IPdfViewer) => void
}
export const PdfViewer: FC<PdfViewerProps> = memo(({ documentId, innerRef, transformScale, onViewerInitialized }) => {
  const documentAtom = useMemo(() => selectAtom(documentsAtom, d => d.get(documentId)), [documentId])
  const document = useGlobalAtomValue(documentAtom)
  const [, setPdfId] = usePdfId()
  const viewerRef = useRef<LayoutFunctions>()
  const mergedRef = useMergedRef(viewerRef, innerRef)
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
    let instance: PdfInstance | null = null
    setPdfId(documentId)
    if (document) {
      instance = {
        pdfId: document.id,
        viewerRef,
        createdAt: Date.now()
      }
      GlobalInstances.pdfInstances.push(instance as PdfInstance)
    }
    return () => {
      if (instance) {
        const idx = GlobalInstances.pdfInstances.findIndex(i => i === instance)
        GlobalInstances.pdfInstances.splice(idx, 1)
      }
    }
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
              annotation.dest && viewerRef.current?.jumpToDest(annotation.dest)
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
