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
  useEffect(() => {
    docRef.current = null
    const params = Object.assign('string' === typeof file ? { url: file } : { data: file })
    const loadingTask = usePdfjs().getDocument(params)
    loadingTask.promise.then(doc => {
      docRef.current = doc
      const map = (viewer && PDF_TO_THUMBNAIL.get(viewer)) || new Map<number, string>()
      if (viewer) {
        PDF_TO_THUMBNAIL.set(viewer, map)
      }
      const promises = []
      for (let i = 1; i < doc.numPages; i++) {
        const promise = new Promise(res => {
          // at least delay 3s and enqueue it in idle task for quick first load
          setTimeout(() => {
            requestIdleCallback(() => {
              doc.getPage(i).then(page => {
                const width = 400
                let viewport = page.getViewport({ scale: 1 })
                const scale = width / viewport.width
                viewport = page.getViewport({ scale })
                const outputScale = window.devicePixelRatio || 1
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')!
                canvas.width = Math.floor(viewport.width * outputScale)
                canvas.height = Math.floor(viewport.height * outputScale)
                const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null
                renderPageInDarkMode()
                page.render({ canvasContext: ctx, transform, viewport }).promise.then(() => {
                  // double idle cb
                  requestIdleCallback(() => {
                    canvas.toBlob(b => {
                      const url = URL.createObjectURL(b)
                      map.set(i - 1, url)
                      res(null)
                    })
                  })
                })
              })
            })
          }, 3000)
        })
        promises.push(promise)
      }
      Promise.all(promises).then(() => {
        viewer?.onThumbnailRendered?.()
      })
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
