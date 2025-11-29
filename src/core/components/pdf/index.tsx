import { Content } from '@/components'
import { atom, createStore, Provider, useStore } from 'jotai'
import { useContext, useEffect, useMemo } from 'react'
import { PdfViewer, PdfViewerProps } from './PdfViewer'
import { PDFStateAtom, useSetPDFState } from './hooks/usePDFState'
import { ObjectStore } from '@/api/stores'
import usePDFInstance, { PdfInstanceAtom, useAssignPdfInstance } from './hooks/usePDFInstance'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import PDFOpsAssigner from '@/core/components/pdf/hooks/ops/Assigner'
import PDFSidebar from '@/core/components/pdf/components/sidebar/PDFSidebar'
import PageConfigContext from '@/core/components/PageConfigContext'

type PdfProps = {
  pdfId: number
} & {
  transformScale?: number
} & Omit<PdfViewerProps, 'documentId'>
const PdfInner = ({ pdfId, onInstanceInitialized, on, transformScale, styles, layout, autoWidth, state, fileUrl }: PdfProps) => {
  useAssignPdfInstance(pdfId)
  const store = useStore()
  const setState = useSetPDFState()
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Shift, e)) {
        setState(s => ({ ...s, selectMode: true }))
      }
      if (isHotkey('mod+c', e)) {
        console.log(instance.values.selectedText, window.getSelection(), Object.keys(instance.values.selectedText).length)
        if (Object.keys(instance.values.selectedText).length > 0 && !window.getSelection()?.toString()) {
          const value = Object.values(instance.values.selectedText).join('')
          console.log(value)
          navigator.clipboard.writeText(value)
        }
      }
    }
    const keyupHandler = () => {
      setState(s => ({ ...s, selectMode: false }))
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
        onFocus={() => {
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
        style={{ overflow: 'hidden', maxHeight: 'inherit' }}
      >
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
        {layout?.showHeader !== false && <PDFSidebar id={pdfId} />}
      </Content>
    </>
  )
}

const Pdf = (props: PdfProps) => {
  const pdf = ObjectStore('pdf').useValue(props.pdfId)
  const pageConfig = useContext(PageConfigContext)
  const defaultOpenSidebar = pageConfig.defaultOpenSidebar !== false
  const store = useMemo(() => {
    const store = createStore()
    store.set(PdfInstanceAtom, {
      values: {
        texts: [],
        INDEX_TO_TEXT_LAYER: {},
        selectedText: {},
        INDEX_TO_PAGE_LAYER: {},
        thumbnailAtom: atom(new Map()),
        isSelecting: false
      }
    })
    const current = store.get(PDFStateAtom)
    store.set(PDFStateAtom, {
      ...current,
      pdfId: props.pdfId,
      state: props.state,
      layout: props.layout,
      styles: props.styles,
      autoWidth: props.autoWidth,
      pageToLabels: {},
      sidebarActive: defaultOpenSidebar ? props.state?.defaultActiveSidebar ?? current.sidebarActive : current.sidebarActive,
      sidebarVisible: defaultOpenSidebar ? props.state?.defaultSidebarVisible ?? current.sidebarVisible : current.sidebarVisible
    })
    return store
  }, [])
  useEffect(() => {
    const pdfState = store.get(PDFStateAtom)
    store.set(PDFStateAtom, {
      ...pdfState,
      document: pdf
    })
  }, [pdf])
  return (
    <Provider store={store}>
      <PdfInner {...props} />
    </Provider>
  )
}

export default Pdf

export { PdfViewer } from './PdfViewer'
