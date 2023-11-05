import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import useGroupState from '@/core/group/hooks/useGroupState'
import { useEffect, useRef, useState } from 'react'
import { useMemoizedFn, useRafFn } from '@/hooks'
import { Box, Point } from '~/typings'
import { calculateSelectionBox } from '@/utils'
import { getDistanceBetweenPointAndScrollableElement } from '@/core/editor/utils/scroll'
import { createPortal } from 'react-dom'
import { Colors } from '@/consts'
import useKeyboardSelect from '@/core/group/hooks/select/useKeyboardSelect'

const useGroupSelect = (selectContainer?: HTMLElement, scrollContainer?: HTMLElement) => {
  const instance = useGroupInstance()
  const [groupState, setGroupState] = useGroupState()
  const [selectBox, setSelectBox] = useState<
    Partial<Box> & {
      startPoint: Point
      endPoint?: Point
    }
  >()
  const stoped = useRef(false)
  const pointerMoveHandler = useMemoizedFn((e: PointerEvent) => {
    e.preventDefault()
    rafPointerMove(e)
  })
  useKeyboardSelect()
  const rafPointerMove = useRafFn((e: PointerEvent) => {
    if (stoped.current) return
    instance.bodyOps?.startDetectAutoScroll()
    setSelectBox(s => {
      if (s) {
        const { startPoint } = s
        const distance = getDistanceBetweenPointAndScrollableElement({ x: e.clientX, y: e.clientY }, selectContainer)
        const endPoint = {
          x: distance.left,
          y: distance.top
        }
        const box = calculateSelectionBox({ startPoint, endPoint })
        instance.values.inViewRowFuncs.forEach((f, key) => {
          const intersected = f.checkIntersected?.(box)
          if (intersected) {
            instance.values.selectedRowIdSet.add(key)
          } else {
            instance.values.selectedRowIdSet.delete(key)
          }
        })
        return {
          startPoint,
          endPoint,
          ...box
        }
      }
      return undefined
    })
  })
  useEffect(() => {
    if (selectContainer && scrollContainer) {
      const pointerDownHandler = (e: PointerEvent) => {
        if (e.target instanceof HTMLElement && !e.target.closest('[role="table-wrapper"') && !e.target.closest('input,textarea')) {
          window.getSelection()?.empty()
          document.activeElement?.blur?.()
          stoped.current = false
          instance.selectOps?.clearAllSelect()
          if (selectBox) {
            setSelectBox(undefined)
            return
          }
          e.preventDefault()
          const distance = getDistanceBetweenPointAndScrollableElement({ x: e.clientX, y: e.clientY }, scrollContainer)
          setSelectBox({
            startPoint: {
              x: distance.left,
              y: distance.top
            }
          })
          setGroupState(s => ({ ...s, isSelecting: true }))
          document.addEventListener('pointerup', pointerUpHandler)
          document.addEventListener('pointermove', pointerMoveHandler, true)
        }
      }

      const pointerUpHandler = (e: PointerEvent) => {
        stoped.current = true
        instance.bodyOps?.endDetectAutoScroll()
        setSelectBox(undefined)
        setGroupState(s => ({ ...s, isSelecting: false, selectArea: undefined }))
        document.removeEventListener('pointerup', pointerUpHandler)
        document.removeEventListener('pointermove', pointerMoveHandler, true)
      }
      selectContainer.addEventListener('pointerdown', pointerDownHandler)
      return () => {
        selectContainer.removeEventListener('pointerdown', pointerDownHandler)
      }
    }
  })
  const renderSelectBox = () =>
    selectContainer &&
    selectBox &&
    createPortal(
      <div style={{ position: 'absolute', ...selectBox, background: Colors.Common.SelectColorTransparent, zIndex: 10000 }}></div>,
      selectContainer
    )
  return renderSelectBox
}

export default useGroupSelect
