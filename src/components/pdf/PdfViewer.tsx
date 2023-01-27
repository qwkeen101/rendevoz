import { IPdfDocument } from '@/../typings/data'
import Viewer from '@/pdfViewer/core/Viewer'
import { FC, RefObject, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import PdfPage from './components/page/Page'
import styles from './index.module.less'
import { RenderPageProps } from '@/pdfViewer/core/types'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { useMemoizedFn, useMergedRef } from '@/hooks'
import useDocumentStore from '@/stores/document.store'
import usePdfInfo from './hooks/usePdfInfo'
import { Range } from '@tanstack/react-virtual'
import { AnnotationType, IAnnotation } from '@/pdfViewer/core/types/annotation'
import Link from './components/annotation/Link'
import useLatest from '@/hooks/utils/useLatest'
import useCurrentDocument from '@/hooks/components/useCurrentDocument'
import usePdfDrag from './hooks/usePdfDrag'
import useViewer, { useSetViewer } from '@/scenes/pdf/useViewer'
import { GlobalInstances, PdfInstance } from '../layout'
import { LayoutFunctions } from '@/pdfViewer/core/layouts/Layout'

interface PdfViewerProps {
  fileUrl?: string
  document?: IPdfDocument
  innerRef?: RefObject<LayoutFunctions>
}
export const PdfViewer: FC<PdfViewerProps> = ({ fileUrl, document, innerRef }) => {
  const [pdfInfo, setPdfInfo] = usePdfInfo()
  const [, setCurrentDocument] = useCurrentDocument()
  const latestPdfInfo = useLatest(pdfInfo)
  const latestDocument = useLatest(document)
  const viewerRef = useRef<LayoutFunctions>()
  const mergedRef = useMergedRef(viewerRef, innerRef)
  const [contextMenuVisible, setContextMenuVisible] = useState(false)

  const { updateDocument } = useDocumentStore()
  // ref to store pdf viewer instance
  const viewboxRef = useRef<HTMLDivElement>(null)
  // ref to store pdf document
  const documentRef = useRef<PDFDocumentProxy>()
  // context event emitter

  usePdfDrag(viewboxRef.current)

  const handleOpenMenu = useCallback(e => {
    e.preventDefault()
    setContextMenuVisible(true)
  }, [])
  const documentId = document?.id
  useEffect(() => {
    let instance: PdfInstance | null = null
    if (document) {
      instance = {
        pdfId: document.id,
        viewerRef,
        createdAt: Date.now()
      }
      GlobalInstances.pdfInstances.push(instance)
      setPdfInfo(document)
      setCurrentDocument(document)
    }
    return () => {
      if (instance) {
        const idx = GlobalInstances.pdfInstances.findIndex(i => i === instance)
        GlobalInstances.pdfInstances.splice(idx, 1)
      }
      setCurrentDocument(null)
      const pdfInfo = latestPdfInfo.current
      const document = latestDocument.current
      if (document) {
        const newDocument: IPdfDocument = {
          ...document,
          lastReadAt: Date.now(),
          readProgress: pdfInfo?.readProgress,
          lastReadPage: pdfInfo?.lastReadPage
        }
        updateDocument(newDocument)
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
      setPdfInfo({ ...pdfInfo, readProgress: progress, lastReadPage: range.startIndex })
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
      {fileUrl && (
        <Viewer
          onDocumentLoaded={doc => (documentRef.current = doc)}
          layoutClassName={styles.viewerLayout}
          innerRef={mergedRef}
          fileUrl={fileUrl}
          renderPage={renderPage}
          renderAnnotation={renderAnnotation}
          onRangeChange={handleRangeChange}
          initialPage={document?.lastReadPage}
        />
      )}
    </div>
  )
}
