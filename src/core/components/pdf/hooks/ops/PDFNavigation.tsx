import { IPdfInstance } from '~/typings'
import { useEffect, useState } from 'react'
import usePdfInstance from '@/core/components/pdf/hooks/usePdfInstance'
import { assignProperties } from '@/utils'
import { useSelectAtomValue } from '@/hooks'
import { PdfStateAtom } from '@/core/components/pdf/hooks/usePdfState'
import { ObjectStore } from '@/api/stores'
import { PAGE_SPACING } from '@/core/components/pdf/core/layouts/Layout'
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'

const historyAtom = atom<{
  offsetArr: number[]
  currIdx: number
}>({
  offsetArr: [],
  currIdx: -1
})
export default () => {
  const instance = usePdfInstance()
  const doublePage = useSelectAtomValue(PdfStateAtom, s => s.document?.doublePage)
  const setPdfState = useSetAtom(PdfStateAtom)
  const [pdfHistoryState, setPdfHistoryState] = useAtom(historyAtom)

  assignProperties(instance, {
    navigateOps: {
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
        const pageIdx = doublePage ? Math.floor(label.page / 2) : label.page
        switch (label.type) {
          case 'crop': {
            const percentageTop = label.rect.top
            const realOffset =
              pageSize.height * pageSize.scale * pageIdx +
              percentageTop * pageSize.height * pageSize.scale +
              PAGE_SPACING * pageIdx -
              pageSize.height * 0.5
            instance.navigateOps?.jumpToOffset(realOffset, { align: 'start' })
            return
          }
          case 'highlight': {
            const labelPercentTop = 'rect' in label ? label.rect![1] : 'rects' in label ? label.rects?.[0].percentageTop : undefined
            if (labelPercentTop !== undefined) {
              const realOffset =
                pageSize.height * pageSize.scale * pageIdx +
                labelPercentTop * pageSize.height * pageSize.scale +
                PAGE_SPACING * pageIdx -
                pageSize.height * 0.5
              instance.navigateOps?.jumpToOffset(realOffset, { align: 'start' })
            }
            return
          }
        }
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
      jumpToPage: async pageIndex => {
        const doc = await instance.getDocument?.()
        const pageSize = instance.getPageSize?.()
        if (pageSize && doc) {
          const numPages = doc.numPages
          if (pageIndex >= 0 && pageIndex < numPages) {
            if (doublePage) {
              const offset = Math.floor(pageIndex / 2) * pageSize.height * pageSize.scale + Math.floor(pageIndex / 2) * 10
              console.log(offset, pageSize)
              instance.navigateOps?.jumpToOffset(offset, {
                align: 'start'
              })
            } else {
              const offset = pageIndex * pageSize.height * pageSize.scale + pageIndex * 10
              instance.navigateOps?.jumpToOffset(offset, {
                align: 'start'
              })
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
