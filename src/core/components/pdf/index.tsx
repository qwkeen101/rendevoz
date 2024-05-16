import { Content } from '@/components'
import { atom, createStore, Provider, useStore } from 'jotai'
import { useEffect, useMemo } from 'react'
import { PdfViewer, PdfViewerProps } from './PdfViewer'
import { PdfStateAtom } from './hooks/usePdfState'
import { globalStore, ObjectStore } from '@/api/stores'
import usePDFInstance, { PdfInstanceAtom, useAssignPdfInstance } from './hooks/usePDFInstance'
import usePdfSelectMode from './hooks/useSelectMode'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import PDFOpsAssigner from '@/core/components/pdf/hooks/ops/Assigner'
import './index.less'
import PDFSidebar from '@/core/components/pdf/components/sidebar/PDFSidebar'

type PdfProps = {
  pdfId: number
} & {
  transformScale?: number
} & Omit<PdfViewerProps, 'documentId'>
const PdfInner = ({ pdfId, onInstanceInitialized, on, transformScale, styles, layout, autoWidth, state, fileUrl }: PdfProps) => {
  useAssignPdfInstance(pdfId)
  const store = useStore()
  const [, setSelectMode] = usePdfSelectMode()
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Shift, e)) {
        setSelectMode(true)
      }
      if (isHotkey('mod+c', e)) {
        if (Object.keys(instance.values.selectedText).length > 0) {
          navigator.clipboard.writeText(Object.values(instance.values.selectedText).join(''))
        }
      }
    }
    const keyupHandler = () => {
      setSelectMode(false)
    }
    document.addEventListener('keydown', keydownHandler)
    document.addEventListener('keyup', keyupHandler)
    return () => {
      const thumbnailURLs = Array.from(store.get(instance.values.thumbnailAtom).values())
      thumbnailURLs.forEach(u => {
        URL.revokeObjectURL(u)
      })
      document.removeEventListener('keydown', keydownHandler)
      document.removeEventListener('keyup', keyupHandler)
    }
  }, [])
  const instance = usePDFInstance()
  return (
    <>
      <PDFOpsAssigner />
      <Content
        tabIndex={0}
        onClick={() => {
          instance.isFocused = true
        }}
        onBlur={() => {
          instance.isFocused = false
        }}
        flex
        column={layout?.showHeader === false}
        centered
        fullWidth
        fullHeight
        style={{ overflow: 'hidden' }}
      >
        {layout?.showHeader !== false && <PDFSidebar id={pdfId} />}
        <PdfViewer
          documentId={pdfId}
          styles={styles}
          state={state}
          fileUrl={fileUrl}
          autoWidth={autoWidth}
          on={on}
          layout={layout}
          transformScale={transformScale}
          onInstanceInitialized={onInstanceInitialized}
        />
      </Content>
    </>
  )
}

const Pdf = (props: PdfProps) => {
  const pdfAtom = ObjectStore('pdf').createAtom(props.pdfId)
  const store = useMemo(() => {
    const store = createStore()
    store.set(PdfInstanceAtom, {
      values: {
        texts: [],
        INDEX_TO_TEXT_LAYER: {},
        selectedText: {},
        INDEX_TO_PAGE_LAYER: {},
        thumbnailAtom: atom(new Map())
      }
    })
    const { pdfId } = props
    ObjectStore('pdf')
      .getOneById(pdfId)
      .then(document => {
        if (document) {
          if (document.labels === undefined) {
            ObjectStore('pdf').updateOne({
              id: pdfId,
              labels: []
            })
          }
          store.set(PdfStateAtom, {
            pdfId: pdfId,
            document,
            state: props.state,
            layout: props.layout,
            styles: props.styles,
            autoWidth: props.autoWidth
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
export { default as usePdfViewer } from './core/hooks/useViewer'
