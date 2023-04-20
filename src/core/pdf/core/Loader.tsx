import Spinner from '@/components/base/Spinner'
import usePdfjs from '@/hooks/utils/usePdfjs'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC, useEffect, useRef, useState } from 'react'
import usePdfViewer from './hooks/useViewer'
import { PDF_TO_DOC } from './weakMaps'

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
      onDocumentLoaded?.(doc)
      PDF_TO_DOC.set(viewer, doc)
      viewer?.onDocumentLoaded?.(doc)
      setLoadingState(LoadingState.Complete)
    })
    return () => {
      loadingTask.destroy()
    }
  }, [file])
  if (loadingState === LoadingState.Complete && docRef.current) {
    return children(docRef.current)
  }
  return <Spinner size={50}/>
}
export default Loader
