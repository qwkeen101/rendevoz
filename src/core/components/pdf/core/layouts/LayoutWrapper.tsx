import Spinner from '@/components/base/Spinner'
import { useDebounceFn, useMemoizedFn, usePrevious, useSelectAtomValue, useUpdateEffect } from '@/hooks'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC, ReactElement, useEffect, useRef, useState } from 'react'
import { useIsomorphicLayoutEffect, useMeasure } from 'react-use'
import { useScrollMode } from '../hooks/useScrollMode'
import { PageSize } from '~/typings'
import { getPage } from '../utils/pages'
import { PdfStateAtom } from '@/core/components/pdf/hooks/usePdfState'
import usePdfInstance from '@/core/components/pdf/hooks/usePdfInstance'
import { useSetAtom } from 'jotai'

interface LayoutWrapperProps {
  defaultScale?: number
  doc: PDFDocumentProxy
  children: (pageSize: PageSize) => ReactElement
}

const RESERVED_HEIGHT = 30
const RESERVED_WIDTH = 30
const LayoutWrapper: FC<LayoutWrapperProps> = ({ defaultScale = 1, doc, children }) => {
  const [scrollMode] = useScrollMode()
  const layoutWrapperRef = useRef<HTMLDivElement>(null)
  const [ref, { width }] = useMeasure()
  const flooredWidth = Math.floor(width)
  const previousWidth = usePrevious(flooredWidth)
  const doublePage = useSelectAtomValue(PdfStateAtom, s => s.document?.doublePage)
  const setPdfState = useSetAtom(PdfStateAtom)
  const [pageSize, setPageSize] = useState<PageSize>({
    height: 0,
    width: 0,
    scale: defaultScale
  })
  useUpdateEffect(() => {
    setPdfState(s => ({ ...s, viewportFitScale: pageSize.scale }))
  }, [pageSize.scale])
  const viewportRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0
  })
  const parentEleRef = useRef<HTMLElement>()
  const [isResizing, setIsResizing] = useState(false)
  const initializedRef = useRef(false)
  const instance = usePdfInstance()
  const pdfScale = useSelectAtomValue(PdfStateAtom, s => s.document?.scale)
  useIsomorphicLayoutEffect(() => {
    initializedRef.current = false
    getPage(doc, 1).then(page => {
      const viewport = page.getViewport({ scale: 1 })
      const vw = viewport.width,
        vh = viewport.height
      viewportRef.current = {
        width: vw,
        height: vh
      }
      const layoutWrapperEle = layoutWrapperRef.current
      if (!layoutWrapperEle) return
      const parentEle = layoutWrapperEle.parentElement
      if (parentEle) {
        parentEleRef.current = parentEle
        ref(parentEle)
        const scaleOfWidth = (Math.min(doublePage ? 2800 : 1400, parentEle.clientWidth) - RESERVED_WIDTH) / vw,
          scaleOfHeight = (parentEle?.clientHeight - RESERVED_HEIGHT) / vh
        let scale = defaultScale
        scrollMode === 'vertical' && (scale = scaleOfWidth)
        scrollMode === 'horizontal' && (scale = Math.min(scaleOfHeight, scaleOfWidth))

        setPageSize({
          height: vh,
          width: vw,
          scale: doublePage ? scale / 2 : scale
        })
        if (!pdfScale) {
          instance.actionOps?.setScale(doublePage ? scale / 2 : scale)
        }
      } else {
        console.error('Viewer has no parent element.This is a bug.')
      }
    })
  }, [doc])

  const handleResize = useMemoizedFn(() => {
    const { width: vw, height: vh } = viewportRef.current
    const parentEle = parentEleRef.current
    console.log('handleResizing')
    if (parentEle) {
      const scaleOfWidth = (Math.min(doublePage ? 2800 : 1400, parentEle.clientWidth) - RESERVED_WIDTH) / vw,
        scaleOfHeight = (parentEle?.clientHeight - RESERVED_HEIGHT) / vh
      let scale = defaultScale
      scrollMode === 'vertical' && (scale = scaleOfWidth)
      scrollMode === 'horizontal' && (scale = Math.min(scaleOfHeight, scaleOfWidth))
      setPageSize({
        height: vh,
        width: vw,
        scale: doublePage ? scale / 2 : scale
      })
    }
    setIsResizing(false)
  })
  const { run: debouncedResize } = useDebounceFn(handleResize, { wait: 100 })
  useUpdateEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      return
    }
    if (flooredWidth !== 0 && previousWidth !== 0) {
      if (initializedRef.current) {
        setIsResizing(true)
        debouncedResize()
      }
    }
  }, [flooredWidth])
  useUpdateEffect(() => {
    handleResize()
    setTimeout(() => {
      instance.actionOps?.fitWidth()
    })
  }, [doublePage])
  return pageSize.width === 0 ? (
    <div aria-label="layout-wrapper" ref={layoutWrapperRef} style={{ width: '100%', height: '100%' }}>
      <Spinner size={50} />
    </div>
  ) : (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <div style={{ width: '100%', height: '100%' }}>{children(pageSize)}</div>
    </div>
  )
}

export default LayoutWrapper
