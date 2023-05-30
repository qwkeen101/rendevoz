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
import { TextItem } from '../types/text'
import Id from '@/utils/id'
import useScopedEventEmitter from '@/events/useEventEmitter'
import usePdfViewer from '../hooks/useViewer'
import { ObjectStore } from '@/stores'
import { IPdfViewer } from '~/typings'
import { getTextContent, PAGE_INDEX_TO_PAGE_FUNCTION, PAGE_INDEX_TO_TEXT_LAYER, PDF_TO_DOC } from '../weakMaps'
import { waitFor } from '@/utils/functions'
import { normalizeText } from '../utils/search'
import { ID_TO_LABEL_MAP } from '../../weakMaps'

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
      return scale * pageSize.height + PAGE_SPACING
    }
  })

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
  const jumpToLabel = async (labelId: number) => {
    const label = await ObjectStore('pdfLabel').getOneById(labelId)
    if (label && label.page !== undefined && ('rect' in label || 'rects' in label)) {
      const labelPercentTop = 'rect' in label ? label.rect?.[1] : 'rects' in label ? label.rects?.[0].percentageTop : undefined
      if (labelPercentTop !== undefined) {
        const realOffset = pageSize.height * scale * label.page + labelPercentTop * pageSize.height * scale + PAGE_SPACING * label.page
        virtualizer.scrollToOffset(realOffset, { align: 'center' })
        if (!viewer) return
        waitFor(
          () => {
            return !!ID_TO_LABEL_MAP.get(viewer)?.has(labelId)
          },
          () => {
            ID_TO_LABEL_MAP.get(viewer)?.get(labelId)?.focus()
          }
        )
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
    if (textRef.current) {
      const results: {
        searchText: string
        pageIndex: number
      }[] = []
      const text = textRef.current
      const search = normalizeText(s).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')

      text.forEach(i => {
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
      currentRangeRef.current = {
        ...currentRangeRef.current,
        progress: e.target.scrollTop / e.target.scrollHeight
      }
      onRangeChange?.(currentRangeRef.current)
    },
    { wait: 500 }
  )
  useEffect(() => {
    if (initialPage) {
      virtualizer.scrollToIndex(initialPage, { align: 'start', behavior: 'auto' })
    }
    if (textRef.current.length === 0) {
      const map = textRef.current
      setTimeout(() => {
        for (let i = 1; i < doc.numPages; i++) {
          requestIdleCallback(() => {
            if (!viewer) return
            getTextContent(viewer, i - 1).then(item => {
              if (!item) return
              const text = item.textContent
              const hasStrTexts = text.items.filter(i => (i as TextItem).str) as TextItem[]
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
                page: i - 1,
                prepared: undefined
              })
            })
          })
        }
      }, 1000)
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
    <div className={className} ref={pagesRef} style={{ height: '100%', width: '100%', overflow: 'auto' }}>
      <PanHelper enablePan={enablePan} containerEle={pagesRef.current} />
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map(item => (
          <div
            data-index={item.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: item.size,
              transform: `translateY(${item.start}px)`,
              paddingBottom: 10
            }}
            key={`${item.index}_page`}
            data-page-index={item.index}
          >
            <PageLayer
              key={item.index}
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
  )
}

export default memo(Layout)
