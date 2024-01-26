import { RefObject, useEffect, useState } from 'react'
import { Box, MetaGroupChild } from '~/typings'
import { boxesIntersect } from '@/utils'
import { getDistanceBetweenElementAndScrollableElement } from '@/core/components/editor/utils/scroll'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import scroll from 'scroll-into-view-if-needed'
/**
 * 检查是否被选中，支持表格，列表，画廊视图等
 */

const useSelectCheck = (containerRef: RefObject<HTMLElement>, rowDetails: MetaGroupChild) => {
  const [isSelected, setIsSelected] = useState(false)
  const instance = useGroupInstance()
  const rowId = rowDetails.tempRowId || rowDetails.rowId
  useEffect(() => {
    if (instance.values.selectedRowIdSet.has(rowId)) {
      setIsSelected(true)
    } else {
      setIsSelected(false)
    }
  })
  const scrollIntoView = () => {
    const c = containerRef.current
    if (c) {
      scroll(containerRef.current, { behavior: 'auto', scrollMode: 'if-needed', block: 'center' })
    }
  }
  const checkIntersect = (box: Box) => {
    const container = containerRef.current
    if (!container) return false
    const scrollElement = instance.getScrollElement?.()
    if (!scrollElement) return false
    const distance = getDistanceBetweenElementAndScrollableElement(container, scrollElement)
    if (!distance) return false
    if (
      boxesIntersect(box, {
        left: distance.left,
        top: distance.top,
        height: distance.bottom - distance.top,
        width: distance.right - distance.left
      })
    ) {
      setIsSelected(true)
      return true
    }
    setIsSelected(false)
    return false
  }
  const clearSelectState = () => {
    setIsSelected(false)
    instance.values.selectedRowIdSet.delete(rowId)
  }
  const select = () => {
    setIsSelected(true)
    instance.values.selectedRowIdSet.add(rowId)
  }
  return {
    isSelected,
    checkIntersect,
    clearSelectState,
    scrollIntoView,
    select
  }
}

export default useSelectCheck
