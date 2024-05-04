import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { assignProperties } from '@/utils'
import { PdfStateAtom } from '@/core/components/pdf/hooks/usePdfState'
import { ObjectStore } from '@/api/stores'
import { atom, useAtom, useAtomValue } from 'jotai'

const historyAtom = atom<{
  offsetArr: number[]
  currIdx: number
}>({
  offsetArr: [],
  currIdx: -1
})
export default () => {
  const instance = usePDFInstance()
  const [pdfState, setPdfState] = useAtom(PdfStateAtom)
  const [pdfHistoryState, setPdfHistoryState] = useAtom(historyAtom)

  assignProperties(instance, {
    navigateOps: {
      scrollByPercent: percent => {
        const pageSize = instance.getPageSize?.()
        if (pageSize) {
          const realHeight = pageSize.height * pageSize.scale
          instance.navigateOps?.scrollBy?.(realHeight * percent)
        }
      },
      scrollBy: y => {
        console.log(y)
        instance.virtualizer?.scrollBy?.(y, { behavior: 'auto' })
      },
      useHistory: () => {
        const h = useAtomValue(historyAtom)
        return {
          canForward: h.currIdx >= 0 && h.offsetArr.length > h.currIdx + 1,
          canBack: h.currIdx >= 1
        }
      },
      jumpToDest: async dest => {
        let realDest
        const doc = await instance.getDocument?.()
        if (!doc) return
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
          instance.navigateOps?.jumpToPage(pageNum)
        }
      },
      jumpToLabel: async labelId => {
        const pageSize = instance.getPageSize?.()
        if (!pageSize) return
        const label = await ObjectStore('pdfLabel').getOneById(labelId)
        if (!label) return
        setPdfState(s => ({ ...s, currentHighlightLabelId: labelId }))
        setTimeout(
          () =>
            setPdfState(s => ({
              ...s,
              currentHighlightLabelId: s.currentHighlightLabelId === labelId ? undefined : s.currentHighlightLabelId
            })),
          1500
        )
        const pageIdx = label.page
        if (pageIdx === undefined) return
        const scale = pdfState.finalScale
        if (!scale) return
        let percent = 0
        switch (label.type) {
          case 'crop': {
            percent = label.rect.top + label.rect.height / 2
            break
          }
          case 'highlight': {
            const labelPercentTop = 'rect' in label ? label.rect![1] : 'rects' in label ? label.rects?.[0].percentageTop : undefined
            let percentHeight = 0
            if ('rect' in label) {
              percentHeight = label.rect![3]
            }
            if ('rects' in label && label.rects) {
              const last = label.rects[label.rects.length - 1]
              percentHeight = last.percentageTop! + last.percentageHeight! - label.rects[0].percentageTop!
            }
            if (labelPercentTop !== undefined) {
              percent = labelPercentTop + percentHeight / 2
            }
            break
          }
        }
        let pageOffset = percent * pageSize.height * pageSize.scale
        const scrollEleHeight = instance.virtualizer?.scrollElement?.clientHeight
        if (scrollEleHeight) {
          pageOffset -= scrollEleHeight / 2
        }
        instance.navigateOps?.jumpToPage(pageIdx, 'start', pageOffset)
      },
      jumpToOffset: (offset, opts) => {
        const virtualizer = instance.virtualizer
        if (virtualizer) {
          virtualizer.scrollToOffset(offset, { align: opts?.align || 'start', behavior: 'auto' })
          if (opts?.canBack !== false) {
            instance.navigateOps?.insertHistory(offset)
          }
        }
      },
      jumpToPage: async (pageIndex, align, outOffset) => {
        const doc = await instance.getDocument?.()
        const pageSize = instance.getPageSize?.()
        if (pageSize && doc) {
          const numPages = doc.numPages
          if (pageIndex >= 0 && pageIndex < numPages) {
            const offset = instance.virtualizer?.getOffsetForIndex(pageIndex, 'start')
            if (offset !== undefined) {
              instance.virtualizer?.scrollToOffset(offset[0] + (outOffset ?? 0) - (pdfState.styles?.paddingTop ?? 60), { align })
            }
          }
        }
      },
      back: () => {
        console.log(pdfHistoryState)
        if (pdfHistoryState.currIdx > -1) {
          const nextIdx = Math.max(0, pdfHistoryState.currIdx - 1)
          setPdfHistoryState(s => ({ ...s, currIdx: nextIdx }))
          instance.navigateOps?.jumpToOffset?.(pdfHistoryState.offsetArr[nextIdx], {
            align: 'start',
            canBack: false
          })
        }
      },
      forward: () => {
        if (pdfHistoryState.currIdx >= 0 && pdfHistoryState.offsetArr.length > pdfHistoryState.currIdx + 1) {
          const nextIdx = pdfHistoryState.currIdx + 1
          setPdfHistoryState(s => ({ ...s, currIdx: nextIdx }))
          instance.navigateOps?.jumpToOffset?.(pdfHistoryState.offsetArr[nextIdx], {
            align: 'start',
            canBack: false
          })
        }
      },
      insertHistory: offset => {
        const v = instance.virtualizer
        if (!v) return
        let addCurr = false
        if (pdfHistoryState.offsetArr[pdfHistoryState.currIdx] !== v.scrollOffset) {
          addCurr = true
        }
        let nextOff = [
          ...(pdfHistoryState.currIdx < pdfHistoryState.offsetArr.length - 1
            ? pdfHistoryState.offsetArr.slice(0, pdfHistoryState.currIdx + 1)
            : pdfHistoryState.offsetArr)
        ]
        if (addCurr) {
          nextOff.push(v.scrollOffset)
        }
        console.log(addCurr)
        nextOff.push(offset)
        setPdfHistoryState(s => ({
          offsetArr: [...nextOff],
          currIdx: s.currIdx + (addCurr ? 2 : 1)
        }))
      }
    }
  })
  return null
}
