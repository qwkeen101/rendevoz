import Spinner from '@/components/base/Spinner'
import { useDebounceFn, useMemoizedFn, useSelectAtomValue, useUpdateEffect } from '@/hooks'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { FC, ReactElement, useEffect, useLayoutEffect, useState } from 'react'
import { PageSize } from '~/typings'
import { getPage } from '../utils/pages'
import { PDFStateAtom } from '@/core/components/pdf/hooks/usePDFState'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { useSetAtom, useStore } from 'jotai'
import { DEFAULT_PDF_PAGE_GAP } from '@/core/components/pdf/core'

interface LayoutWrapperProps {
  defaultScale?: number
  doc: PDFDocumentProxy
  children: (pageSize: PageSize) => ReactElement
  containerWidth: number
}

const LayoutWrapper: FC<LayoutWrapperProps> = ({ defaultScale = 1, doc, children, containerWidth }) => {
  const doublePage = useSelectAtomValue(PDFStateAtom, s => s.state?.doublePage)
  const setPdfState = useSetAtom(PDFStateAtom)
  const store = useStore()
  const [pageSize, setPageSize] = useState<PageSize>({
    height: 0,
    width: 0,
    scale: defaultScale,
    containerWidth: 0
  })
  useEffect(() => {
    setPdfState(s => ({ ...s, viewportFitScale: pageSize.scale }))
  }, [pageSize.scale])
  const instance = usePDFInstance()
  const pdfScale = useSelectAtomValue(PDFStateAtom, s => s.document?.scale)
  const calculateSize = useMemoizedFn(() => {
    const pages = doc.numPages
    getPage(doc, pages > 1 ? 1 : 0).then(page => {
      const viewport = page.getViewport({ scale: 1 })
      const vw = viewport.width,
        vh = viewport.height
      const maxWidth = store.get(PDFStateAtom).styles?.pdfMaxWidth ?? 1200
      // 计算缩放，最大宽度为1200, 目前仅有垂直模式
      // 最小padding为12
      const containerFinalWidth =
        Math.min(containerWidth, doublePage ? maxWidth * 2 : maxWidth) -
        (store.get(PDFStateAtom)?.styles?.minPagePadding ?? DEFAULT_PDF_PAGE_GAP) * (doublePage ? 3 : 2)
      const scale = containerFinalWidth / vw
      // 获取了宽高，以及针对应用的缩放
      setPageSize({
        height: vh,
        width: vw,
        scale: doublePage ? scale / 2 : scale,
        containerWidth: containerFinalWidth
      })
      if (!pdfScale) {
        instance.actionOps?.setScale(doublePage ? scale / 2 : scale)
      }
    })
  })
  useLayoutEffect(() => {
    calculateSize()
  }, [doc])
  const { run: debouncedResize } = useDebounceFn(calculateSize, { wait: 100 })
  useUpdateEffect(() => {
    debouncedResize()
  }, [containerWidth])
  const [isChangingMode, setIsChangingMode] = useState(false)
  useUpdateEffect(() => {
    setIsChangingMode(true)
    calculateSize()
    if (!doublePage) {
      const initial = store.get(PDFStateAtom).state?.initialPage
      if (initial !== undefined) {
        instance.on?.({
          type: 'readProgressChange',
          lastReadPage: Math.max(0, initial - 1)
        })
      }
    }
    setTimeout(() => {
      instance.actionOps?.fitWidth()
      setTimeout(() => setIsChangingMode(false), 100)
    }, 100)
  }, [doublePage])
  return pageSize.width === 0 || isChangingMode ? (
    <div style={{ width: '100%', height: '100%' }}>
      <Spinner size={50} />
    </div>
  ) : (
    children(pageSize)
  )
}

export default LayoutWrapper
