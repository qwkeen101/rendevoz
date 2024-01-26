import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { RefObject, useEffect, useRef, useState } from 'react'
import { useMemoizedFn, useRafFn } from '@/hooks'
import { Box, Point } from '~/typings'
import { calculateSelectionBox } from '@/utils'
import { getDistanceBetweenPointAndScrollableElement } from '@/core/components/editor/utils/scroll'
import { createPortal } from 'react-dom'
import { Colors } from '@/consts'
import useKeyboardSelect from '@/core/components/group/hooks/select/useKeyboardSelect'
import { useUpdate } from 'react-use'
import { useSetAtom } from 'jotai'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'

const GroupSelectBox = ({
  scrollContainerRef,
  selectContainerRef
}: {
  selectContainerRef: RefObject<HTMLElement>
  scrollContainerRef: RefObject<HTMLElement>
}) => {
  const scrollContainer = scrollContainerRef.current
  const selectContainer = selectContainerRef.current
  const instance = useGroupInstance()
  const [selectBox, setSelectBox] = useState<
    Partial<Box> & {
      startPoint: Point
      endPoint?: Point
    }
  >()
  const stoped = useRef(false)
  const setGroupState = useSetAtom(GroupStateAtom)
  const pointerMoveHandler = useMemoizedFn((e: PointerEvent) => {
    e.preventDefault()
    rafPointerMove(e)
  })
  useKeyboardSelect()
  const update = useUpdate()
  useEffect(() => {
    update()
  }, [])
  const setedRef = useRef(false)
  const rafPointerMove = useRafFn((e: PointerEvent) => {
    if (stoped.current) return
    instance.bodyOps?.startDetectAutoScroll()
    if (!setedRef.current) {
      setGroupState(s => ({ ...s, isSelecting: true }))
      setedRef.current = true
    }
    if (!selectContainer) return
    setSelectBox(s => {
      if (s) {
        const { startPoint } = s
        const distance = getDistanceBetweenPointAndScrollableElement({ x: e.clientX, y: e.clientY }, selectContainer)
        const endPoint = {
          x: distance.left,
          y: distance.top
        }
        const selectContainerRect = selectContainer?.getBoundingClientRect()
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
          left: selectContainerRect.left + box.left - selectContainer.scrollLeft,
          top: selectContainerRect.top + box.top - selectContainer.scrollTop,
          width: box.width,
          height: box.height
        }
      }
      return undefined
    })
  })

  const memoPointerUp = useMemoizedFn(() => {
    stoped.current = true
    instance.bodyOps?.endDetectAutoScroll()
    setGroupState(s => ({ ...s, isSelecting: false }))
    setSelectBox(undefined)
    setedRef.current = false
    document.removeEventListener('pointerup', memoPointerUp)
    document.removeEventListener('pointermove', pointerMoveHandler, true)
  })
  useEffect(() => {
    if (selectContainer && scrollContainer) {
      const pointerDownHandler = (e: PointerEvent) => {
        if (
          e.target instanceof HTMLElement &&
          !e.target.closest(
            '[role="table-wrapper"],[role="group-drag-handle"],[role="gallery-item-wrapper"],[role="list-item-wrapper"],[role="reorder-view"],input,textarea'
          )
        ) {
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
          document.addEventListener('pointerup', memoPointerUp)
          document.addEventListener('pointermove', pointerMoveHandler, true)
        }
      }

      selectContainer.addEventListener('pointerdown', pointerDownHandler)
      return () => {
        selectContainer.removeEventListener('pointerdown', pointerDownHandler)
      }
    }
  })

  return (
    selectContainer &&
    selectBox &&
    createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            ...selectBox,
            background: 'rgba(39, 158, 255, 0.2)',
            position: 'absolute',
            borderRadius: 0
          }}
        ></div>
      </div>,
      document.body
    )
  )
}

export default GroupSelectBox
