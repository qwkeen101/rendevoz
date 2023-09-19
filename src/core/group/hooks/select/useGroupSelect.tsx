import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import useGroupState from '@/core/group/hooks/useGroupState'
import { RefObject, useEffect, useRef, useState } from 'react'
import { useMemoizedFn, useRafFn } from '@/hooks'
import { Box, Point } from '~/typings'
import { calculateBoxArea, calculateSelectionBox } from '@/utils'
import { ClassName } from 'rendevoz'
import { getDistanceBetweenPointAndScrollableElement } from '@/core/editor/utils/scroll'
import { createPortal } from 'react-dom'
import { Colors } from '@/consts'

const useGroupSelect = (container?: HTMLElement) => {
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
  const rafPointerMove = useRafFn((e: PointerEvent) => {
    if (stoped.current) return
    instance.bodyOps?.startDetectAutoScroll()
    setSelectBox(s => {
      if (s) {
        const { startPoint } = s
        const distance = getDistanceBetweenPointAndScrollableElement({ x: e.clientX, y: e.clientY }, container)
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
    if (container) {
      const pointerDownHandler = (e: PointerEvent) => {
        if (e.target === e.currentTarget) {
          stoped.current = false
          if (selectBox) {
            setSelectBox(undefined)
            instance.values.selectedRowIdSet.clear()
            return
          }
          e.preventDefault()
          const distance = getDistanceBetweenPointAndScrollableElement({ x: e.clientX, y: e.clientY }, container)
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
      container.addEventListener('pointerdown', pointerDownHandler)
      return () => {
        container.removeEventListener('pointerdown', pointerDownHandler)
      }
    }
  })
  const renderSelectBox = () =>
    container &&
    createPortal(
      // <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', ...selectBox, background: Colors.Common.SelectColorTransparent }}></div>,
      // </div>,
      container
    )
  return renderSelectBox
}

export default useGroupSelect
