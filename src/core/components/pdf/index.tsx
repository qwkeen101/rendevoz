import { Content } from '@/components'
import { atom, createStore, Provider, useStore } from 'jotai'
import { useEffect, useMemo, useRef } from 'react'
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
import { PdfBarStateAtom } from '@/core/components/pdf/hooks/usePDFBarState'

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
  const pdf = ObjectStore('pdf').useValue(props.pdfId)
  const defaultSidebarChanged = useRef(false)
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
    store.set(PdfStateAtom, {
      pdfId: props.pdfId,
      state: props.state,
      layout: props.layout,
      styles: props.styles,
      autoWidth: props.autoWidth
    })
    if (pdf?.defaultActiveSidebar) {
      defaultSidebarChanged.current = true
      store.set(PdfBarStateAtom, { ...store.get(PdfBarStateAtom), sidebarActive: pdf.defaultActiveSidebar ?? 'hide' })
    }
    return store
  }, [])
  useEffect(() => {
    const pdfState = store.get(PdfStateAtom)
    if (pdf && !pdf.labels) {
      ObjectStore('pdf').updateOne({
        id: pdf.id,
        labels: []
      })
    }
    store.set(PdfStateAtom, {
      ...pdfState,
      document: pdf
    })
    if (pdf?.defaultActiveSidebar && !defaultSidebarChanged.current) {
      defaultSidebarChanged.current = true
      store.set(PdfBarStateAtom, { ...store.get(PdfBarStateAtom), sidebarActive: pdf.defaultActiveSidebar ?? 'hide' })
    }
  }, [pdf])
  return (
    <Provider store={store}>
      <PdfInner {...props} />
    </Provider>
  )
}

export default Pdf

export { PdfViewer } from './PdfViewer'
export { default as usePdfViewer } from './core/hooks/useViewer'
