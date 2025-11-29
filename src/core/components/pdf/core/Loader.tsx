import Spinner from '@/components/base/Spinner'
import usePdfjs from '@/hooks/utils/usePdfjs'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC, useEffect, useState } from 'react'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { PDFDocumentLoadingTask } from 'pdfjs-dist/types/src/display/api'

interface LoaderProps {
  file: string | Uint8Array
  children: (doc: PDFDocumentProxy) => React.ReactElement
  onDocumentLoaded?: (doc: PDFDocumentProxy) => void
  thumbnailWorker?: boolean
}
enum LoadingState {
  Complete,
  Fail,
  Loading
}
const Loader: FC<LoaderProps> = ({ file, children, onDocumentLoaded, thumbnailWorker = true }) => {
  const instance = usePDFInstance()
  const [loadingState, setLoadingState] = useState(LoadingState.Loading)

  useEffect(() => {
    instance.values.document = undefined
    instance.values.thumbnailDocument = undefined
    const params = Object.assign('string' === typeof file ? { url: file } : { data: file })
    const loadingTask = usePdfjs().getDocument({
      ...params,
      cMapPacked: true,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.8.162/cmaps/'
    })
    let thumbnailLoadingTask: undefined | PDFDocumentLoadingTask = undefined
    if (thumbnailWorker) {
      thumbnailLoadingTask = usePdfjs().getDocument({
        ...params,
        cMapPacked: true,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.8.162/cmaps/'
      })
      thumbnailLoadingTask.promise.then(doc => {
        instance.values.thumbnailDocument = doc
      })
    }
    loadingTask.promise.then(doc => {
      instance.values.document = doc
      onDocumentLoaded?.(doc)
      setLoadingState(LoadingState.Complete)
    })

    return () => {
      thumbnailLoadingTask?.destroy()
      loadingTask.destroy()
    }
  }, [file])
  if (loadingState === LoadingState.Complete && instance.values.document) {
    return children(instance.values.document)
  }
  return <Spinner size={50} />
}
export default Loader
