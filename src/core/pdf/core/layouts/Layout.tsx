import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC, memo, ReactElement, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { defaultRangeExtractor, Range, useVirtualizer, VirtualItem } from '@tanstack/react-virtual'
import { useDebounceEffect, useDebounceFn, useMemoizedFn, useSelectAtomValue, useUpdateEffect } from '@/hooks'
import PageLayer from '../layers/PageLayer'
import { useScrollMode } from '../hooks/useScrollMode'
import { decreaseLevel, increaseLevel } from '../utils/zoom'
import PanHelper from '../utils/pan'
import Id from '@/utils/id'
import useScopedEventEmitter from '@/events/useEventEmitter'
import usePdfViewer from '../hooks/useViewer'
import { ObjectStore } from '@/stores'
import { Box, IPdfViewer, PageSize, RenderPageProps, IAnnotation, TextItem } from '~/typings'
import { PAGE_INDEX_TO_PAGE_FUNCTION, PAGE_INDEX_TO_TEXT_LAYER, PDF_TO_DOC } from '../weakMaps'
import { waitFor } from '@/utils/functions'
import { normalizeText } from '../utils/search'
import { PdfStateAtom } from '../../hooks/usePdfState'
import { calculateImageAspectRatio, saveImageLocally } from '@/utils'
import { useSetAtom } from 'jotai'

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

export const PAGE_SPACING = 10
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
  const autoFitWhenResize = false
  const setPdfState = useSetAtom(PdfStateAtom)
  const viewer = usePdfViewer()

  const textRef = useRef<
    {
      id: number
      str: string
      page: number
    }[]
  >([])
  const scaleRef = useRef(pageSize.scale)
  const currentRangeRef = useRef<Range>({
    startIndex: 0,
    endIndex: 0,
    overscan: 5,
    count: 0
  })

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
    // return (scrollMode === 'horizontal' ? result.width : result.height) + PAGE_SPACING
    return scale * pageSize.height + PAGE_SPACING
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
    overscan: 3,
    paddingEnd: 70,
    paddingStart: 60
    // measureElement: () => {
    //   return scale * pageSize.height + PAGE_SPACING
    // }
  })

  const [virtualItems, setVirtualItems] = useState<VirtualItem[]>([])

  useUpdateEffect(() => {
    if (autoFitWhenResize) {
      setScale(pageSize.scale)
    }
  }, [pageSize.scale, autoFitWhenResize])

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
      const offset = pageIndex * pageSize.height * scale + pageIndex * 10
      virtualizer.scrollToOffset(offset, { align: 'start', behavior: 'auto' })
    }
  }
  const jumpToArea = (page: number, box: Box) => {
    jumpToPage?.(page)
    if (rect) {
      const pageSize = viewer.getPageSize?.()
      if (pageSize) {
        const realPageHeight = pageSize.height * pageSize.scale
        viewer.scrollToOffset?.(page * realPageHeight + box.top * realPageHeight + (box.height * realPageHeight) / 2 + page * PAGE_SPACING)
      }

      viewer.highlightArea?.(page, box)
    }
  }
  const jumpToLabel = async (labelId: number) => {
    const label = await ObjectStore('pdfLabel').getOneById(labelId)
    if (label && label.type === 'highlight' && label.page !== undefined && ('rect' in label || 'rects' in label)) {
      const labelPercentTop = 'rect' in label ? label.rect?.[1] : 'rects' in label ? label.rects?.[0].percentageTop : undefined
      if (labelPercentTop !== undefined) {
        const realOffset = pageSize.height * scale * label.page + labelPercentTop * pageSize.height * scale + PAGE_SPACING * label.page
        virtualizer.scrollToOffset(realOffset, { align: 'center' })
      }
    }
    if (label && label.type === 'crop' && label.page !== undefined && label.rect) {
      const percentageTop = label.rect.top
      const realOffset = pageSize.height * scale * label.page + percentageTop * pageSize.height * scale + PAGE_SPACING * label.page
      virtualizer.scrollToOffset(realOffset, { align: 'center' })
    }
    setPdfState(s => ({ ...s, currentHighlightLabelId: labelId }))
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
    if (textRef.current) {
      const results: {
        searchText: string
        pageIndex: number
      }[] = []
      const text = textRef.current
      const search = normalizeText(s).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
      const reg = new RegExp(search, 'gi')
      const quickFilter = text.filter(i => i.str.match(reg))
      quickFilter.forEach(i => {
        const reg = new RegExp(search, 'gi')
        const indexes = ([...i.str.matchAll(reg)].map(i => i.index).filter(i => i !== undefined) as number[]).reduce((prev, curr, idx) => {
          if (idx === 0) {
            prev.push(curr)
          } else {
            const last = prev[prev.length - 1]
            if (curr - last > 80 + search.length) {
              prev.push(curr)
            }
          }
          return prev
        }, [] as number[])
        // five results per page
        indexes.slice(0, 5).forEach(index => {
          let cropStr = i.str.slice(Math.max(0, index - 80), Math.min(index + search.length + 80, i.str.length)).replace(reg, '<em>$&</em>')
          const appendBefore = index - 80 > 0
          const appendAfter = index + search.length + 80 < i.str.length
          if (appendBefore) {
            cropStr = '...' + cropStr
          }
          if (appendAfter) {
            cropStr = cropStr + '...'
          }
          results.push({
            searchText: cropStr,
            pageIndex: i.page
          })
        })
      })
      return results
    }
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
    if (textRef.current.length === 0 && viewer) {
      const map = textRef.current
      const currentPage = {
        current: 0
      }
      viewer.getDocument?.().then(doc => {
        const asyncLoopTextContent = () => {
          if (currentPage.current === doc.numPages) return
          doc
            .getPage(currentPage.current + 1)
            .then(page => page.getTextContent())
            .then(item => {
              const hasStrTexts = item.items.filter(i => (i as TextItem).str) as TextItem[]
              const str = hasStrTexts
                .map(i => {
                  if (i.hasEOL) {
                    return i.str + ' '
                  }
                  return i.str
                })
                .join('')
              const normalized = normalizeText(str)

              const id = Id.getId()
              map.push({
                id,
                str: normalized,
                page: currentPage.current
              })
              currentPage.current += 1
              requestIdleCallback(() => asyncLoopTextContent())
            })
        }
        asyncLoopTextContent()
      })
    }
    const pages = pagesRef.current
    if (pages) {
      pages.addEventListener('scroll', handleScroll)
    }
    return () => {
      pages?.removeEventListener('scroll', handleScroll)
    }
  }, [doc])

  useDebounceEffect(
    () => {
      setVirtualItems(virtualizer.getVirtualItems())
    },
    [virtualizer.getVirtualItems()],
    { wait: 20 }
  )
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
      jumpToArea,
      highlightText: (str, pageIndex) => {
        return new Promise(res => {
          waitFor(
            () => {
              const pageFunctionRef = PAGE_INDEX_TO_PAGE_FUNCTION.get(viewer)?.get(pageIndex)
              if (pageFunctionRef?.current.highlightText) {
                return true
              }
              return false
            },
            () => {
              PAGE_INDEX_TO_PAGE_FUNCTION.get(viewer)?.get(pageIndex)?.current.highlightText?.(str)
              res()
            }
          )
        })
      },
      jumpToOffset,
      scrollBy,
      capturePageImage: (page: number, box: Box) => {
        return new Promise(res => {
          doc.getPage(page + 1).then(p => {
            const c = document.createElement('canvas')
            const viewport = p.getViewport({ scale: 1.5 })
            const resolution = window.devicePixelRatio
            c.width = viewport.width * resolution
            c.height = viewport.height * resolution
            const r = p.render({ canvasContext: c.getContext('2d')!, viewport, transform: [resolution, 0, 0, resolution, 0, 0] })
            r.promise.then(() => {
              if (box) {
                const newCanvas = document.createElement('canvas')
                const originalWidth = viewport.width * box.width * resolution
                const originalHeight = viewport.height * box.height * resolution
                const { width, height } = calculateImageAspectRatio(originalWidth, originalHeight, 800, 800)
                newCanvas.width = width
                newCanvas.height = height
                newCanvas
                  .getContext('2d')
                  ?.drawImage(
                    c,
                    viewport.width * box.left * resolution,
                    viewport.height * box.top * resolution,
                    viewport.width * box.width * resolution,
                    viewport.height * box.height * resolution,
                    0,
                    0,
                    width,
                    height
                  )
                const dataURL = newCanvas.toDataURL()
                saveImageLocally(dataURL).then(s => {
                  res(s)
                })
              } else {
                const dataURL = c.toDataURL()
                saveImageLocally(dataURL).then(s => {
                  res(s)
                })
              }
            })
          })
        })
      },
      jumpToLabel,
      scrollToOffset: offset => {
        virtualizer.scrollToOffset(offset, { align: 'center' })
      },
      getPageSize: () => ({
        scale,
        height: pageSize.height,
        width: pageSize.width,
        pageSizeScale: pageSize.scale
      }),
      highlightArea: (pageIndex, rect) => {
        return new Promise(res => {
          waitFor(
            () => {
              const pageFunctionRef = PAGE_INDEX_TO_PAGE_FUNCTION.get(viewer)?.get(pageIndex)
              if (pageFunctionRef?.current.highlightArea) {
                return true
              }
              return false
            },
            () => {
              const pageFunctionRef = PAGE_INDEX_TO_PAGE_FUNCTION.get(viewer)?.get(pageIndex)
              if (pageFunctionRef) {
                pageFunctionRef.current.highlightArea?.(rect)
                res()
              }
            }
          )
        })
      },
      getDocument: () => {
        return new Promise(res => {
          if (PDF_TO_DOC.has(viewer)) {
            res(PDF_TO_DOC.get(viewer)!)
          } else {
            viewer.onDocumentLoaded = doc => {
              PDF_TO_DOC.set(viewer, doc)
              res(doc)
            }
          }
        })
      },
      getTextLayerInstance: idx => {
        return new Promise(res => {
          if (!PAGE_INDEX_TO_TEXT_LAYER.has(viewer)) {
            console.log('create new map')
            PAGE_INDEX_TO_TEXT_LAYER.set(viewer, new Map())
          }

          const map = PAGE_INDEX_TO_TEXT_LAYER.get(viewer)
          if (map?.has(idx)) {
            res(map.get(idx)!)
          } else {
            viewer.jumpToPage?.(idx)
            viewer.onTextLayerRendered = (pageIdx, ins) => {
              map?.set(pageIdx, ins)
              if (idx === pageIdx) {
                res(ins)
              }
            }
          }
        })
      }
    } as IPdfViewer)
  }

  return (
    <div className={className} ref={pagesRef} style={{ height: '100%', width: '100%', overflow: 'auto', maxWidth: 1500 }}>
      <PanHelper enablePan={enablePan} containerEle={pagesRef.current} />
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: virtualItems?.[0] ? `translateY(${virtualItems[0].start}px)` : undefined
          }}
        >
          {virtualItems.map(item => (
            <div
              data-index={item.index}
              ref={virtualizer.measureElement}
              style={{
                width: '100%',
                paddingBottom: 10,
                position: 'relative'
              }}
              key={item.key}
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
      </div>
    </div>
  )
}

export default memo(Layout)
