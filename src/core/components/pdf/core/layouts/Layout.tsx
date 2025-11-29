import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC, memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Range, useVirtualizer } from '@/components'
import { useDebounceFn, useMemoizedFn, useSelectAtomValue } from '@/hooks'
import PageLayer from '../layers/PageLayer'
import { PageSize, IPDFInstance } from '~/typings'
import { waitFor } from '@/utils/functions'
import { PDFStateAtom } from '../../hooks/usePDFState'
import { useSetAtom } from 'jotai'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { isEqual } from 'lodash'
import makeDocumentSearchable from '@/core/components/pdf/core/layouts/makeDocumentSearchable'
import { DEFAULT_PDF_PAGE_GAP } from '@/core/components/pdf/core'
import classnames from 'classnames'

interface LayoutProps {
  doc: PDFDocumentProxy
  defaultScale?: number
  initialPage: number
  pageSize: PageSize
  className?: string
  transformScale?: number
}

export const PAGE_SPACING = 10
const Layout: FC<LayoutProps> = ({ doc, defaultScale, initialPage, pageSize, className, transformScale }) => {
  const { numPages } = doc
  const pagesRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState(0)
  const {
    autoWidth,
    scale = defaultScale ?? 1,
    doublePage,
    scaleChanged,
    enableSearch,
    pageGap = 7,
    minPagePadding = DEFAULT_PDF_PAGE_GAP,
    pageBoxShadowName = 'var(--box-shadow)'
  } = useSelectAtomValue(
    PDFStateAtom,
    s => ({
      autoWidth: s.autoWidth,
      scale: s.document?.scale,
      doublePage: s.state?.doublePage,
      minPagePadding: s.styles?.minPagePadding,
      scaleChanged: s.scaleChanged,
      enableSearch: s.state?.enableSearch,
      pageGap: s.styles?.pageGap,
      pageBoxShadowName: s.styles?.pageBoxShadowName
    }),
    { compare: isEqual }
  )
  const fitScale = pageSize.scale
  const finalScale = scaleChanged ? scale : autoWidth ? fitScale || scale : scale
  const finalPageGap = Math.max(pageGap * finalScale, minPagePadding)
  const setPdfState = useSetAtom(PDFStateAtom)
  useLayoutEffect(() => {
    setPdfState(s => ({ ...s, finalScale }))
  }, [finalScale])
  const instance = usePDFInstance()
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
    return result.height + finalPageGap
  }

  const rangeExtractor = useMemoizedFn((range: Range) => {
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
  const initialOffset = useMemo(() => {
    let offset = 0
    let start = initialPage ?? 0
    if (start) {
      if (doublePage) {
        if (start % 2 === 1) {
          start -= 1
        }
      }
    }
    start = Math.max(0, start)
    offset = (estimateSize() * start) / (doublePage ? 2 : 1) + 1
    return offset
  }, [initialPage])
  const virtualizer = useVirtualizer({
    count: numPages,
    getScrollElement: () => pagesRef.current,
    estimateSize,
    rangeExtractor,
    initialOffset,
    overscan: 2,
    lanes: doublePage ? 2 : 1,
    paddingEnd: finalPageGap,
    onChange: i => {
      if (i.range) {
        handleRangeChange(i.range)
      }
    }
  })
  instance.virtualizer = virtualizer

  const virtualItems = virtualizer.getVirtualItems()
  const { run: handleRangeChange } = useDebounceFn(
    (range: { startIndex: number; endIndex: number }) => {
      setPdfState(s => (s.currentFocusedLabel ? { ...s, currentFocusedLabel: undefined } : s))
      instance.on?.({
        type: 'readProgressChange',
        lastReadPage: range.startIndex
      })
    },
    { wait: 200 }
  )
  useEffect(() => {
    let abort: VoidFunction | undefined = undefined
    if (instance.values.texts.length === 0 && instance && enableSearch !== false) {
      abort = makeDocumentSearchable(doc, instance)
    }
    return () => {
      abort?.()
    }
  }, [doc])

  if (instance) {
    Object.assign(instance, {
      highlightSentence: (pageIndex, idx) => {
        instance.navigateOps?.jumpToPage(pageIndex)
        return new Promise(res => {
          waitFor(
            () => !!instance.getPageFuncs(pageIndex)?.highlightSentence,
            () => {
              !instance.getPageFuncs(pageIndex)?.highlightSentence?.(idx)
              res()
            },
            {
              requestAnimationFrame: true
            }
          )
        })
      },
      highlightText: (str, pageIndex, numIndex, paintRed) => {
        instance.navigateOps?.jumpToPage(pageIndex)
        return new Promise(res => {
          waitFor(
            () => !!instance.getPageFuncs(pageIndex)?.highlightText,
            () => {
              instance.getPageFuncs(pageIndex)?.highlightText?.(str, numIndex, paintRed)
              res()
            },
            {
              requestAnimationFrame: true
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
          instance.navigateOps?.jumpToPage?.(pageIndex, 'start', Math.max(rect.top - 0.1, 0) * pageSize.height)
          waitFor(
            () => instance.getPageFuncs(pageIndex)?.highlightArea !== undefined,
            () => {
              const func = instance.getPageFuncs(pageIndex)?.highlightArea
              if (func) {
                func(rect)
                res()
              }
            },
            { requestAnimationFrame: true }
          )
        })
      }
    } as IPDFInstance)
  }

  return (
    <div
      tabIndex={0}
      className={className}
      ref={pagesRef}
      style={{ height: '100%', width: '100%', overflow: 'auto', overflowAnchor: 'none' }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: doublePage ? result.width * 2 + finalPageGap : '100%',
          position: 'relative',
          margin: doublePage ? '0 auto' : undefined
        }}
      >
        <div
          style={{
            left: doublePage ? '50%' : 0,
            columnGap: finalPageGap,
            transform: virtualItems?.[0] ? `translateY(${virtualItems[0].start}px) ${doublePage ? `translateX(-50%)` : ''}` : undefined
          }}
          className={classnames('grid w-full top-0 absolute', doublePage ? 'grid-cols-2' : 'grid-cols-1')}
        >
          {virtualItems.map(item => (
            <div
              data-index={item.index}
              ref={virtualizer.measureElement}
              style={{
                width: doublePage ? '50%' : '100%',
                position: 'relative',
                paddingTop: finalPageGap
              }}
              key={item.key}
            >
              <PageLayer
                transformScale={transformScale}
                boxShadowName={pageBoxShadowName}
                doc={doc}
                height={result.height}
                pageIndex={item.index}
                scaleChanged={scaleChanged}
                scale={finalScale}
                width={result.width}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(Layout)
