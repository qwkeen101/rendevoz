import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC, memo, ReactElement, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { defaultRangeExtractor, Range, useVirtualizer, Virtualizer } from '@tanstack/react-virtual'
import { useDebounceFn, useMemoizedFn, useUpdateEffect } from '@/hooks'
import PageLayer from '../layers/PageLayer'
import { PageSize, RenderPageProps } from '../types/page'
import { useScrollMode } from '../hooks/useScrollMode'
import { IAnnotation } from '../types/annotation'
import { Noop } from '@/common/types'
import { decreaseLevel, increaseLevel } from '../utils/zoom'
import PanHelper from '../utils/pan'
import fuzzysort from 'fuzzysort'
import { TextItem } from '../types/text'
import Id from '@/utils/id'
import useScopedEventEmitter from '@/events/useEventEmitter'
import usePdfViewer from '../hooks/useViewer'
import { LabelStore } from '@/stores'

interface LayoutProps {
  doc: PDFDocumentProxy
  defaultScale?: number
  initialPage: number
  pageSize: PageSize
  renderPage?: (props: RenderPageProps) => ReactElement
  renderAnnotation?: (annotation: IAnnotation) => ReactElement
  onRangeChange?: (range?: Range) => void
  innerRef: any
  className?: string
  transformScale?: number
}
export interface LayoutFunctions {
  jumpToPage: (pageIndex: number) => void
  search: (word: string) => Fuzzysort.KeyResults<{
    id: number
    str: string
    page: number
    prepared: Fuzzysort.Prepared
  }>
  zoomIn: Noop
  zoomOut: Noop
  autoFit: Noop
  togglePan: Noop
  highlightText: (str: string, pageIndex: number) => void
  jumpToDest: (dest: string | any[]) => void
  jumpToOffset: (offset: number) => void
  scrollBy: (offset: number) => void
  getOutline: () => Promise<
    {
      title: string
      bold: boolean
      italic: boolean
      color: Uint8ClampedArray
      dest: string | any[] | null
      url: string | null
      unsafeUrl: string | undefined
      newWindow: boolean | undefined
      count: number | undefined
      items: any[]
    }[]
  >
}
const PAGE_SPACING = 10
const Layout: FC<LayoutProps> = ({
  doc,
  defaultScale,
  initialPage,
  pageSize,
  renderPage,
  renderAnnotation,
  innerRef,
  className,
  onRangeChange,
  transformScale
}) => {
  const { numPages } = doc
  const [scrollMode] = useScrollMode()
  const pagesRef = useRef<HTMLDivElement>(null)
  const visibleRangeRef = useRef([0, 0])
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(pageSize.scale)
  const [enablePan, setEnablePan] = useState(false)
  const viewer = usePdfViewer()
  const textRef = useRef<
    {
      id: number
      str: string
      page: number
      prepared: Fuzzysort.Prepared
    }[]
  >([])
  const scaleRef = useRef(pageSize.scale)
  const currentRangeRef = useRef<Range>()

  useImperativeHandle(innerRef, () => ({
    jumpToPage,
    zoomIn,
    zoomOut,
    autoFit,
    togglePan,
    getOutline,
    jumpToDest,
    search,
    highlightText,
    jumpToOffset,
    scrollBy
  }))
  const { height, width } = pageSize
  const innerEmitter = useScopedEventEmitter()
  const rect =
    Math.abs(rotation) % 180 === 0
      ? {
          h: height,
          w: width
        }
      : {
          h: width,
          w: height
        }
  const result = {
    height: rect.h * scale,
    width: rect.w * scale
  }
  const estimateSize = () => {
    return (scrollMode === 'horizontal' ? result.width : result.height) + PAGE_SPACING
  }
  const rangeExtractor = useMemoizedFn(range => {
    visibleRangeRef.current = [range.startIndex, range.endIndex]
    currentRangeRef.current = range
    return defaultRangeExtractor(range)
  })

  const virtualizer = useVirtualizer({
    count: numPages,
    getScrollElement: () => pagesRef.current,
    estimateSize,
    rangeExtractor,
    overscan: 2,
    measureElement: () => {
      return scaleRef.current * pageSize.height + PAGE_SPACING
    }
  })
  useUpdateEffect(() => {
    setScale(pageSize.scale)
  }, [pageSize])
  useUpdateEffect(() => {
    const previousScale = scaleRef.current
    scaleRef.current = scale
    const pages = pagesRef.current
    if (!pages) {
      return
    }
    const { scrollTop, scrollLeft } = pages
    const newOffset = {
      scrollTop: scrollTop * (scale / previousScale),
      scrollLeft: scrollLeft * (scale / previousScale)
    }
    virtualizer.measure()
    virtualizer.scrollToOffset(newOffset.scrollTop, { behavior: 'auto' })
  }, [scale])
  const jumpToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < numPages) {
      virtualizer.scrollToIndex(pageIndex, { align: 'start', behavior: 'auto' })
    }
  }
  const jumpToLabel = async (labelId: number) => {
    const label = await LabelStore.getLabelById(labelId)
    if (label && label.page !== undefined && ('rect' in label || 'rects' in label)) {
      const pageOffset = virtualizer.getOffsetForIndex(label.page, 'start')
      const labelPercentTop = 'rect' in label ? label.rect?.[1] : 'rects' in label ? label.rects?.[0].percentageTop : undefined
      if (labelPercentTop !== undefined) {
        const realOffset = pageOffset[0] + labelPercentTop * pageSize.height * pageSize.scale
        console.log(realOffset, pageOffset, labelPercentTop, pageSize)
        virtualizer.scrollToOffset(realOffset, { align: 'center' })
      }
    }
  }
  const jumpToDest = async (dest: string | any[]) => {
    let realDest
    if (typeof dest === 'string') {
      realDest = await doc.getDestination(dest)
    } else {
      realDest = dest
    }
    if (!Array.isArray(realDest)) return
    const destRef = realDest[0]
    let pageNum = undefined
    if (typeof destRef === 'object' && destRef !== null) {
      pageNum = await doc.getPageIndex(destRef)
    }
    if (Number.isInteger(destRef)) {
      pageNum = destRef + 1
    }
    if (pageNum !== undefined) {
      jumpToPage(pageNum)
    }
  }
  const jumpToOffset = (offset: number) => {
    virtualizer.scrollToOffset(offset, { behavior: 'auto' })
  }
  const scrollBy = (offset: number) => {
    virtualizer.scrollBy(offset)
  }
  const zoomIn = () => {
    const nextScale = increaseLevel(scale)
    setScale(nextScale)
  }
  const zoomOut = () => {
    const nextScale = decreaseLevel(scale)
    console.log(nextScale)
    setScale(nextScale)
  }
  const autoFit = () => {
    setScale(pageSize.scale)
  }
  const togglePan = () => {
    setEnablePan(!enablePan)
  }
  const getOutline = async () => {
    const outline = await doc.getOutline()
    return outline
  }
  const search = (s: string) => {
    const result = fuzzysort.go(s, textRef.current, { key: 'prepared', limit: 50 })
    return result
  }
  const highlightText = (str: string, pageIndex: number) => {
    innerEmitter.emit(
      'pdf',
      {
        type: 'highlightText',
        data: {
          page: pageIndex,
          str
        }
      },
      true
    )
  }
  const renderViewer = () => {
    return (
      <div style={{ height: `${estimateSize() * numPages}px`, width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map(item => (
          <div
            data-index={item.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${estimateSize()}px`,
              transform: `translateY(${item.index * estimateSize()}px)`,
              paddingBottom: 10
            }}
            key={item.index}
            data-page-index={item.index}
          >
            <PageLayer
              transformScale={transformScale}
              scrollElement={pagesRef}
              renderPage={renderPage}
              doc={doc}
              height={result.height}
              pageIndex={item.index}
              scale={scale}
              width={result.width}
              renderAnnotation={renderAnnotation}
            />
          </div>
        ))}
      </div>
    )
  }
  const { run: handleScroll } = useDebounceFn(
    e => {
      currentRangeRef.current = {
        ...currentRangeRef.current,
        progress: e.target.scrollTop / e.target.scrollHeight
      }
      onRangeChange?.(currentRangeRef.current)
    },
    { wait: 200 }
  )
  useEffect(() => {
    if (initialPage) {
      virtualizer.scrollToIndex(initialPage, { align: 'start', behavior: 'auto' })
    }
    if (textRef.current.length === 0) {
      const map = textRef.current
      for (let i = 1; i < doc.numPages; i++) {
        requestIdleCallback(() => {
          doc.getPage(i).then(page => {
            page.getTextContent().then(text => {
              const hasStrTexts = text.items.filter(i => (i as TextItem).str) as TextItem[]
              hasStrTexts.forEach(t => {
                const str = t.str
                const id = Id.getId()
                map.push({
                  id,
                  str,
                  page: i - 1,
                  prepared: fuzzysort.prepare(str)
                })
              })
            })
          })
        })
      }
    }
    const pages = pagesRef.current
    if (pages) {
      pages.addEventListener('scroll', handleScroll)
    }
    return () => {
      pages?.removeEventListener('scroll', handleScroll)
    }
  }, [doc])

  if (viewer) {
    Object.assign(viewer, {
      jumpToPage,
      zoomIn,
      zoomOut,
      autoFit,
      togglePan,
      getOutline,
      jumpToDest,
      search,
      highlightText,
      jumpToOffset,
      scrollBy,
      jumpToLabel
    })
  }

  return (
    <div className={className} ref={pagesRef} style={{ height: '100%', width: '100%', overflow: 'auto' }}>
      <PanHelper enablePan={enablePan} containerEle={pagesRef.current} />
      {renderViewer()}
    </div>
  )
}

export default memo(Layout)
