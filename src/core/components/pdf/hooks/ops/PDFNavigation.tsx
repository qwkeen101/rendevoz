import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { assignProperties } from '@/utils'
import usePDFState from '@/core/components/pdf/hooks/usePDFState'
import { ObjectStore } from '@/api/stores'

export default () => {
  const instance = usePDFInstance()
  const [state, setState] = usePDFState()
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
          instance.on?.({
            type: 'readProgressChange',
            lastReadPage: pageNum
          })
        }
      },
      jumpToLabel: async (labelId, openInSidebar = true) => {
        const pageSize = instance.getPageSize?.()
        if (!pageSize) return
        const label = await ObjectStore('pdfLabel').getOneById(labelId)
        if (!label) return
        setState(s => ({ ...s, currentHighlightLabelId: labelId }))
        setTimeout(
          () =>
            setState(s => ({
              ...s,
              currentHighlightLabelId: s.currentHighlightLabelId === labelId ? undefined : s.currentHighlightLabelId
            })),
          1500
        )
        const pageIdx = label.page
        if (pageIdx === undefined) return
        const scale = state.finalScale
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
        if (state.sidebarActive === 'label' && state.sidebarVisible && openInSidebar) {
          instance.jumpToLabelInSidebar?.(labelId)
        }
        instance.navigateOps?.jumpToPage(pageIdx, 'start', pageOffset)
      },
      jumpToOffset: (offset, opts) => {
        const virtualizer = instance.virtualizer
        if (virtualizer) {
          virtualizer.scrollToOffset(offset, { align: opts?.align || 'start', behavior: 'auto' })
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
              instance.virtualizer?.scrollToOffset(offset[0] + (outOffset ?? 5), { align })
            }
          }
        }
      }
    }
  })
  return null
}
