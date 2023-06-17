import Spinner from '@/components/base/Spinner'
import usePdfjs from '@/hooks/utils/usePdfjs'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC, useEffect, useRef, useState } from 'react'
import usePdfViewer from './hooks/useViewer'
import { PDF_TO_DOC, PDF_TO_THUMBNAIL } from './weakMaps'
import { renderPageInDarkMode } from './utils/renderer'

interface LoaderProps {
  file: string | Uint8Array
  children: (doc: PDFDocumentProxy) => React.ReactElement
  onDocumentLoaded?: (doc: PDFDocumentProxy) => void
}
enum LoadingState {
  Complete,
  Fail,
  Loading
}
const Loader: FC<LoaderProps> = ({ file, children, onDocumentLoaded }) => {
  const docRef = useRef<PDFDocumentProxy | null>(null)
  const viewer = usePdfViewer()
  const [loadingState, setLoadingState] = useState(LoadingState.Loading)
  const getThumbnail = async (doc: PDFDocumentProxy) => {
    const map = (viewer && PDF_TO_THUMBNAIL.get(viewer)) || new Map<number, string>()
    if (viewer) {
      PDF_TO_THUMBNAIL.set(viewer, map)
    }
    const currentPage = {
      current: 0
    }
    const totalPages = doc.numPages
    const canvas = document.createElement('canvas')
    const width = 400
    const firstPage = await doc.getPage(1)
    let viewport = firstPage.getViewport({ scale: 1 })
    const scale = width / viewport.width
    viewport = firstPage.getViewport({ scale })
    const outputScale = window.devicePixelRatio || 1
    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null
    canvas.width = Math.floor(viewport.width * outputScale)
    canvas.height = Math.floor(viewport.height * outputScale)
    const ctx = canvas.getContext('2d')!
    const asyncGetThumbnailLoop = () => {
      const curr = currentPage.current
      currentPage.current = curr + 1
      if (curr === totalPages) {
        return
      }
      requestIdleCallback(async () => {
        try {
          const page = await doc.getPage(curr + 1)
          renderPageInDarkMode()
          await page.render({ canvasContext: ctx, transform, viewport }).promise
          requestIdleCallback(() => {
            canvas.toBlob(b => {
              if (b) {
                const url = URL.createObjectURL(b)
                map.set(curr, url)
                asyncGetThumbnailLoop()
                viewer?.onThumbnailRendered?.()
              }
            })
          })
        } catch (e) {
          console.log(e)
        }
      })
    }
    asyncGetThumbnailLoop()
  }
  useEffect(() => {
    docRef.current = null
    const params = Object.assign('string' === typeof file ? { url: file } : { data: file })
    const loadingTask = usePdfjs().getDocument(params)
    loadingTask.promise.then(doc => {
      docRef.current = doc
      getThumbnail(doc)
      onDocumentLoaded?.(doc)
      PDF_TO_DOC.set(viewer, doc)
      viewer?.onDocumentLoaded?.(doc)
      setLoadingState(LoadingState.Complete)
    })
    return () => {
      console.log('clearing')
      loadingTask.destroy()
      if (viewer) {
        PDF_TO_THUMBNAIL.get(viewer)?.forEach(([v, k]) => {
          URL.revokeObjectURL(v)
        })
      }
    }
  }, [file])
  if (loadingState === LoadingState.Complete && docRef.current) {
    return children(docRef.current)
  }
  return <Spinner size={50} />
}
export default Loader
