import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC, memo, ReactElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Range, useVirtualizer } from '@tanstack/react-virtual'
import { useDebounceFn, useMemoizedFn, useSelectAtomValue } from '@/hooks'
import PageLayer from '../layers/PageLayer'
import PanHelper from '../utils/pan'
import { PageSize, RenderPageProps, IAnnotation, IPDFInstance } from '~/typings'
import { PAGE_INDEX_TO_PAGE_FUNCTION } from '../weakMaps'
import { waitFor } from '@/utils/functions'
import { PdfStateAtom } from '../../hooks/usePdfState'
import { useSetAtom } from 'jotai'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { isEqual } from 'lodash'
import makeDocumentSearchable from '@/core/components/pdf/core/layouts/makeDocumentSearchable'

interface LayoutProps {
  doc: PDFDocumentProxy
  defaultScale?: number
  initialPage: number
  pageSize: PageSize
  renderPage?: (props: RenderPageProps) => ReactElement
  renderAnnotation?: (annotation: IAnnotation) => ReactElement
  onRangeChange?: (range?: Range) => void
  className?: string
  transformScale?: number
}

export const PAGE_SPACING = 10
const Layout: FC<LayoutProps> = ({
  doc,
  defaultScale,
  initialPage,
  pageSize,
  renderPage,
  renderAnnotation,
  className,
  onRangeChange,
  transformScale
}) => {
  const { numPages } = doc
  const pagesRef = useRef<HTMLDivElement>(null)
  const visibleRangeRef = useRef([0, 0])
  const [rotation, setRotation] = useState(0)
  const {
    autoWidth,
    scale = defaultScale ?? 1,
    enablePan,
    paddingTop = 60,
    doublePage,
    paddingEnd = 70,
    scaleChanged,
    enableSearch,
    pageGap = 10,
    pageBoxShadowName = 'var(--box-shadow)',
    pagePadding = 30
  } = useSelectAtomValue(
    PdfStateAtom,
    s => ({
      autoWidth: s.autoWidth,
      scale: s.document?.scale,
      enablePan: s.handDrag,
      paddingTop: s.styles?.paddingTop,
      paddingEnd: s.styles?.paddingEnd,
      doublePage: s.state?.doublePage,
      scaleChanged: s.scaleChanged,
      enableSearch: s.state?.enableSearch,
      pageGap: s.styles?.pageGap,
      pagePadding: s.styles?.pagePadding,
      pageBoxShadowName: s.styles?.pageBoxShadowName
    }),
    { compare: isEqual }
  )
  const fitScale = pageSize.scale
  const finalScale = scaleChanged ? scale : autoWidth ? fitScale || scale : scale
  const setPdfState = useSetAtom(PdfStateAtom)
  useLayoutEffect(() => {
    setPdfState(s => ({ ...s, finalScale }))
  }, [finalScale])
  const instance = usePDFInstance()
  const currentRangeRef = useRef<Range>({
    startIndex: 0,
    endIndex: 0,
    overscan: 5,
    count: 0
  })

  const { height, width } = pageSize

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
    height: rect.h * finalScale,
    width: rect.w * finalScale
  }
  const estimateSize = () => {
    // return (scrollMode === 'horizontal' ? result.width : result.height) + PAGE_SPACING
    return finalScale * pageSize.height + PAGE_SPACING
  }

  const rangeExtractor = useMemoizedFn((range: Range) => {
    visibleRangeRef.current = [range.startIndex, range.endIndex]
    currentRangeRef.current = range
    let start = Math.max(range.startIndex - range.overscan * (doublePage ? 2 : 1), 0)
    const end = Math.min(range.endIndex + range.overscan * (doublePage ? 2 : 1), range.count - 1)
    if (doublePage) {
      if (start % 2 === 1) {
        start = start - 1
      }
    }
    const arr = []

    for (let i = start; i <= end; i++) {
      arr.push(i)
    }

    return arr
  })
  const virtualizer = useVirtualizer({
    count: numPages,
    getScrollElement: () => pagesRef.current,
    estimateSize,
    rangeExtractor,
    overscan: 2,
    lanes: doublePage ? 2 : 1,
    paddingEnd: paddingEnd,
    paddingStart: paddingTop
  })
  instance.virtualizer = virtualizer

  const virtualItems = virtualizer.getVirtualItems()

  const { run: handleScroll } = useDebounceFn(
    e => {
      setPdfState(s => (s.currentFocusedLabel ? { ...s, currentFocusedLabel: undefined } : s))
      const currentStart = currentRangeRef.current?.startIndex
      const offsetOfStart = virtualizer.getOffsetForIndex(currentStart)[0]
      const offsetOfSecond = virtualizer.getOffsetForIndex(currentStart + 1)[0]
      const height = offsetOfSecond - offsetOfStart
      console.log(height, e.target.scrollTop)
      currentRangeRef.current.currentIndex =
        e.target.scrollTop > offsetOfStart + height / 2 ? Math.min(currentStart + 1, doc.numPages - 1) : currentStart

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
      virtualizer.scrollToIndex(initialPage, {
        align: 'start',
        behavior: 'auto'
      })
    }
    let abort: VoidFunction | undefined = undefined
    if (instance.values.texts.length === 0 && instance && enableSearch !== false) {
      abort = makeDocumentSearchable(doc, instance)
    }
    const pages = pagesRef.current
    if (pages) {
      pages.addEventListener('scroll', handleScroll)
    }
    return () => {
      abort?.()
      pages?.removeEventListener('scroll', handleScroll)
    }
  }, [doc])

  if (instance) {
    Object.assign(instance, {
      highlightText: (str, pageIndex) => {
        return new Promise(res => {
          waitFor(
            () => {
              const pageFunctionRef = PAGE_INDEX_TO_PAGE_FUNCTION.get(instance)?.get(pageIndex)
              if (pageFunctionRef?.current.highlightText) {
                return true
              }
              return false
            },
            () => {
              PAGE_INDEX_TO_PAGE_FUNCTION.get(instance)?.get(pageIndex)?.current.highlightText?.(str)
              res()
            }
          )
        })
      },
      getPageSize: () => ({
        scale: finalScale,
        height: pageSize.height,
        width: pageSize.width,
        pageSizeScale: pageSize.scale
      }),
      highlightArea: (pageIndex, rect) => {
        return new Promise(res => {
          waitFor(
            () => {
              const pageFunctionRef = PAGE_INDEX_TO_PAGE_FUNCTION.get(instance)?.get(pageIndex)
              if (pageFunctionRef?.current.highlightArea) {
                return true
              }
              return false
            },
            () => {
              const pageFunctionRef = PAGE_INDEX_TO_PAGE_FUNCTION.get(instance)?.get(pageIndex)
              if (pageFunctionRef) {
                pageFunctionRef.current.highlightArea?.(rect)
                res()
              }
            }
          )
        })
      }
    } as IPDFInstance)
  }

  return (
    <div className={className} ref={pagesRef} style={{ height: '100%', width: '100%', overflow: 'auto', overflowAnchor: 'none' }}>
      <PanHelper enablePan={enablePan} containerEle={pagesRef.current} />
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: doublePage ? result.width * 2 + 20 : '100%',
          position: 'relative',
          margin: doublePage ? '0 auto' : undefined
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: doublePage ? '50%' : 0,
            width: '100%',
            display: 'flex',
            flexDirection: doublePage ? 'row' : 'column',
            flexWrap: 'wrap',
            transform: virtualItems?.[0] ? `translateY(${virtualItems[0].start}px) ${doublePage ? `translateX(-50%)` : ''}` : undefined
          }}
        >
          {virtualItems.map(item => (
            <div
              data-index={item.index}
              ref={virtualizer.measureElement}
              style={{
                width: doublePage ? '50%' : '100%',
                paddingBottom: pageGap
              }}
              key={item.key}
              data-page-index={item.index}
            >
              <PageLayer
                transformScale={transformScale}
                scrollElement={pagesRef}
                renderPage={renderPage}
                pagePadding={pagePadding}
                boxShadowName={pageBoxShadowName}
                containerWidth={doublePage ? pageSize.containerWidth / 2 + pagePadding / 2 : pageSize.containerWidth}
                doc={doc}
                height={result.height}
                pageIndex={item.index}
                scaleChanged={scaleChanged}
                scale={finalScale}
                width={result.width}
                renderAnnotation={renderAnnotation}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(Layout)
