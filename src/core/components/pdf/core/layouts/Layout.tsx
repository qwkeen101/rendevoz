import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC, memo, ReactElement, useEffect, useRef, useState } from 'react'
import { defaultRangeExtractor, Range, useVirtualizer } from '@tanstack/react-virtual'
import { useDebounceFn, useMemoizedFn, useSelectAtomValue, useUpdateEffect } from '@/hooks'
import PageLayer from '../layers/PageLayer'
import PanHelper from '../utils/pan'
import Id from '@/utils/id'
import { Box, IPdfViewer, PageSize, RenderPageProps, IAnnotation, TextItem } from '~/typings'
import { PAGE_INDEX_TO_PAGE_FUNCTION, PAGE_INDEX_TO_TEXT_LAYER, PDF_TO_DOC } from '../weakMaps'
import { waitFor } from '@/utils/functions'
import { normalizeText } from '../utils/search'
import { PdfStateAtom } from '../../hooks/usePdfState'
import { calculateImageAspectRatio, saveImageLocally } from '@/utils'
import { useSetAtom } from 'jotai'
import { renderPageInDarkMode, renderPageInNormalMode } from '@/core/components/pdf/core/utils/renderer'
import usePdfInstance from '@/core/components/pdf/hooks/usePdfInstance'
import { isEqual } from 'lodash'

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
  const instance = usePdfInstance()

  const textRef = useRef<
    {
      id: number
      str: string
      page: number
    }[]
  >([])
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
    console.log(range.overscan)
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
    debug: true,
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

  const scrollBy = (offset: number) => {
    virtualizer.scrollBy(offset)
  }
  const togglePan = () => {}
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
    if (textRef.current.length === 0 && instance && enableSearch !== false) {
      const map = textRef.current
      const currentPage = {
        current: 0
      }
      instance.getDocument?.().then(doc => {
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

  if (instance) {
    Object.assign(instance, {
      togglePan,
      getOutline,
      getTextOfPages: () => {
        return textRef.current
      },
      search,
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
      scrollBy,
      capturePageImage: (page: number, box: Box) => {
        return new Promise(res => {
          doc.getPage(page + 1).then(p => {
            const c = document.createElement('canvas')
            const viewport = p.getViewport({ scale: 1.5 })
            const resolution = window.devicePixelRatio
            c.width = viewport.width * resolution
            c.height = viewport.height * resolution
            renderPageInDarkMode()
            const r = p.render({ canvasContext: c.getContext('2d')!, viewport, transform: [resolution, 0, 0, resolution, 0, 0] })
            r.promise.then(() => {
              renderPageInNormalMode()
              if (box) {
                const newCanvas = document.createElement('canvas')
                const originalWidth = viewport.width * box.width * resolution
                const originalHeight = viewport.height * box.height * resolution
                const { width, height } = calculateImageAspectRatio(originalWidth, originalHeight, 1200, 1200)
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
                saveImageLocally(dataURL, {
                  compress: false
                }).then(s => {
                  res(s)
                })
              } else {
                const dataURL = c.toDataURL()
                saveImageLocally(dataURL, {
                  compress: false
                }).then(s => {
                  res(s)
                })
              }
            })
          })
        })
      },
      scrollToOffset: offset => {
        virtualizer.scrollToOffset(offset, { align: 'center' })
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
      },
      getDocument: () => {
        return new Promise(res => {
          if (PDF_TO_DOC.has(instance)) {
            res(PDF_TO_DOC.get(instance)!)
          } else {
            instance.onDocumentLoaded = doc => {
              PDF_TO_DOC.set(instance, doc)
              res(doc)
            }
          }
        })
      },
      getTextLayerInstance: idx => {
        return new Promise(res => {
          if (!PAGE_INDEX_TO_TEXT_LAYER.has(instance)) {
            PAGE_INDEX_TO_TEXT_LAYER.set(instance, new Map())
          }

          const map = PAGE_INDEX_TO_TEXT_LAYER.get(instance)
          if (map?.has(idx)) {
            res(map.get(idx)!)
          } else {
            instance.navigateOps?.jumpToPage?.(idx)
            instance.onTextLayerRendered = (pageIdx, ins) => {
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
