import Spinner from '@/components/base/Spinner'
import { useDebounceFn, usePrevious, useUpdateEffect } from '@/hooks'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC, ReactElement, useRef, useState } from 'react'
import { useIsomorphicLayoutEffect, useMeasure } from 'react-use'
import { useScrollMode } from '../hooks/useScrollMode'
import { PageSize } from '../types/page'
import { getPage } from '../utils/pages'

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
  const [pageSize, setPageSize] = useState<PageSize>({
    height: 0,
    width: 0,
    scale: defaultScale
  })
  const viewportRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0
  })
  const parentEleRef = useRef<HTMLElement>()
  const [isResizing, setIsResizing] = useState(false)
  const initializedRef = useRef(false)
  useIsomorphicLayoutEffect(() => {
    initializedRef.current = false
    getPage(doc, 0).then(page => {
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
        const scaleOfWidth = (Math.min(1100, parentEle.clientWidth) - RESERVED_WIDTH) / vw,
          scaleOfHeight = (parentEle?.clientHeight - RESERVED_HEIGHT) / vh
        let scale = defaultScale
        scrollMode === 'vertical' && (scale = scaleOfWidth)
        scrollMode === 'horizontal' && (scale = Math.min(scaleOfHeight, scaleOfWidth))
        console.log(scale)
        setPageSize({
          height: vh,
          width: vw,
          scale: scale
        })
      } else {
        console.error('Viewer has no parent element.This is a bug.')
      }
    })
  }, [doc])

  const handleResize = () => {
    const { width: vw, height: vh } = viewportRef.current
    const parentEle = parentEleRef.current
    console.log('handleResizing')
    if (parentEle) {
      const scaleOfWidth = (Math.min(1500, parentEle.clientWidth) - RESERVED_WIDTH) / vw,
        scaleOfHeight = (parentEle?.clientHeight - RESERVED_HEIGHT) / vh
      let scale = defaultScale
      scrollMode === 'vertical' && (scale = scaleOfWidth)
      scrollMode === 'horizontal' && (scale = Math.min(scaleOfHeight, scaleOfWidth))
      setPageSize({
        height: vh,
        width: vw,
        scale: scale
      })
    }
    setIsResizing(false)
  }
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

  return pageSize.width === 0 ? (
    <div aria-label="layout-wrapper" ref={layoutWrapperRef} style={{ width: '100%', height: '100%', maxWidth: 1500 }}>
      <Spinner size={50} />
    </div>
  ) : (
    <div
      style={{
        width: '100%',
        maxWidth: 1500,
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <div style={{ width: '100%', height: '100%' }}>{children(pageSize)}</div>
    </div>
  )
}

export default LayoutWrapper
