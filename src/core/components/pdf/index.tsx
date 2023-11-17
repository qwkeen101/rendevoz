import { Content } from '@/components'
import { createStore, Provider } from 'jotai'
import { useEffect, useMemo } from 'react'
import { PdfViewer } from './PdfViewer'
import PdfRightSidebar from './components/sidebar/PdfRightSidebar'
import { PdfStateAtom } from './hooks/usePdfState'
import { globalStore, ObjectStore } from '@/api/stores'
import { IPdfInstance } from '~/typings'
import PdfLeftSidebar from './components/sidebar/PdfLeftSidebar'
import { PdfInstanceAtom, useAssignPdfInstance } from './hooks/usePdfInstance'
import { getAllLabelsOfDocument } from '@/api/stores/document.store'
import usePdfSelectMode from './hooks/useSelectMode'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'

type PdfProps = {
  pdfId: number
  onInstanceInitialized?: (i: IPdfInstance) => void
} & {
  transformScale?: number
}
const PdfInner = ({ pdfId, onInstanceInitialized, transformScale }: PdfProps) => {
  useAssignPdfInstance(pdfId)
  const [, setSelectMode] = usePdfSelectMode()
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Shift, e)) {
        setSelectMode(true)
      }
    }
    const keyupHandler = (e: KeyboardEvent) => {
      setSelectMode(false)
    }
    document.addEventListener('keydown', keydownHandler)
    document.addEventListener('keyup', keyupHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
      document.removeEventListener('keyup', keyupHandler)
    }
  }, [])
  return (
    <Content flex column fullHeight fullWidth>
      <Content flex centered auto style={{ height: 0 }}>
        <PdfLeftSidebar />
        <PdfViewer documentId={pdfId} transformScale={transformScale} onInstanceInitialized={onInstanceInitialized} />
        <PdfRightSidebar />
      </Content>
    </Content>
  )
}

const Pdf = (props: PdfProps) => {
  const pdfAtom = ObjectStore('pdf').createAtom(props.pdfId)
  const store = useMemo(() => {
    const store = createStore()
    store.set(PdfInstanceAtom, {})
    const { pdfId } = props
    ObjectStore('pdf')
      .getOneById(pdfId)
      .then(document => {
        if (document) {
          if (document.labels === undefined) {
            getAllLabelsOfDocument(pdfId).then(labels =>
              ObjectStore('pdf').updateOne({
                id: pdfId,
                labels: labels.map(i => i.id) || []
              })
            )
          }
          store.set(PdfStateAtom, {
            pdfId: pdfId,
            document,
            autoFitWhenResize: true
          })
        }
      })

    return store
  }, [])
  useEffect(() => {
    const unsub = globalStore.sub(pdfAtom, () => {
      const value = globalStore.get(pdfAtom)
      const pdfState = store.get(PdfStateAtom)
      store.set(PdfStateAtom, {
        ...pdfState,
        document: value
      })
    })
    return () => {
      unsub()
    }
  }, [])
  return (
    <Provider store={store}>
      <PdfInner {...props} />
    </Provider>
  )
}

export default Pdf

export { PdfViewer } from './PdfViewer'
export * from './weakMaps'
export { default as usePdfViewer } from './core/hooks/useViewer'
