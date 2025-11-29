import { assignProperties } from '@/utils'
import { useAutoScroll, useMemoizedFn, useRafFn } from '@/hooks'
import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Box, CustomEditor, Point } from '~/typings'
import { getDistanceBetweenPointAndScrollableElement } from '../utils/scroll'
import useIsSelecting from './useIsSelecting'
import useEditorInstance from '../hooks/useEditorInstance'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import useReadOnlyEditor from '../hooks/useReadOnly'
import { ReactEditor } from '@/core'
import { createPortal } from 'react-dom'
import { mousePos } from '@/hooks/utils/useMousePositionRef'

const useEditorSelect = (editor: CustomEditor, scrollElementRef: RefObject<HTMLDivElement>) => {
  const isPressed = useRef(false)
  const [isSelecting, setIsSelecting] = useIsSelecting()
  const [selectArea, setSelectArea] = useState<Box>()
  const { run, end } = useAutoScroll({
    scrollElementRef,
    onScroll: () => handleSelect()
  })
  const scrollElement = scrollElementRef.current
  const readonly = useReadOnlyEditor()
  const instance = useEditorInstance()
  const startPointRef = useRef<Point>()
  const mouseDownHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    // target is title or textbox
    if (target.closest('[role="editor-drag-handle"]')) {
      return
    }
    if (!target.closest('[role="editor-title"]')) {
      if (target.getAttribute('role') === 'textbox') {
        isPressed.current = true
      }
      // target is self
      if (target === e.currentTarget) {
        isPressed.current = true
      }
      if (!target.closest('.selectable')) {
        isPressed.current = true
      }
    }
    if (isPressed.current) {
      if (e.defaultPrevented) {
        isPressed.current = false
      }
      e.preventDefault()
    }
    let deselectAll = true

    instance.values.selectingAll = false
    if (instance.values.selectedBlocks.size === 1 && e.target instanceof HTMLElement) {
      const closestBlock = e.target.closest('.selectable')?.closest('[data-type="block"]')
      if (closestBlock) {
        const element = ReactEditor.toSlateNode(editor, closestBlock)
        const onlyOneSelected = instance.values.selectedBlocks.keys().next().value
        if (element.id === onlyOneSelected) {
          deselectAll = false
        }
      }
    }
    if (deselectAll) {
      instance.selectOps?.deselectAll()
    }
  }
  const keyDownHandler = (e: KeyboardEvent) => {
    const selected = instance.values.selectedBlocks
    if (isHotkey(KEY.Delete, e) || isHotkey(KEY.Backspace, e)) {
      if (selected.size) {
        instance.overlayOps?.close()
        e.preventDefault()
        e.stopPropagation()
      }
      instance.blockOps?.deleteBlock()
    }
    if (isHotkey(KEY.Escape, e)) {
      if (selected.size) {
        selected.forEach(v => {
          v.pathRef?.unref()
          v.removeSelectedState?.()
        })
        selected.clear()
      }
      window.getSelection()?.empty()
    }
  }
  const handleSelect = () => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) return
    const distance = getDistanceBetweenPointAndScrollableElement(
      {
        x: mousePos.current[0],
        y: mousePos.current[1]
      },
      scrollElement
    )
    const startPoint = startPointRef.current || { x: distance.left, y: distance.top }
    startPointRef.current = startPoint
    const endPoint = { x: distance.left, y: distance.top }
    const currRect = {
      left: Math.min(startPoint.x, endPoint.x),
      top: Math.min(startPoint.y, endPoint.y),
      width: Math.abs(startPoint.x - endPoint.x),
      height: Math.abs(startPoint.y - endPoint.y)
    }
    const scrollElementRect = scrollElement.getBoundingClientRect()
    const left = scrollElementRect.left + currRect.left
    const top = scrollElementRect.top + currRect.top - scrollElement.scrollTop
    setSelectArea({ left, top, width: currRect.width, height: currRect.height })
    instance.values.ID_TO_ELEMENT.forEach(i => {
      i.collisionSelectBlock(currRect)
    })
  }
  const mouseMoveHandler = useMemoizedFn((e: MouseEvent) => {
    if (readonly) return
    if (!scrollElement) return
    if (isPressed.current) {
      setIsSelecting(true)
      run(e)
      handleSelect()
    }
  })
  const mouseUpHandler = (e: MouseEvent) => {
    end()
    startPointRef.current = undefined
    setSelectArea(undefined)
    if (readonly) return
    isPressed.current = false
    if (isSelecting) {
      document.body.style.cursor = 'auto'
      setTimeout(() => {
        setIsSelecting(false)
      }, 0)
    }
  }
  const throttledMoveMove = useRafFn(mouseMoveHandler)
  const realMouseMoveHandler = (e: MouseEvent) => {
    if (readonly) return
    if (isPressed.current) {
      e.preventDefault()
      e.stopPropagation()
      try {
        throttledMoveMove(e)
      } catch (e) {
        console.error(e)
      }
    }
  }
  useLayoutEffect(() => {
    if (readonly) return
    if (isSelecting) {
      document.body.style.cursor = 'default'
    }
  }, [isSelecting])
  assignProperties(instance, {
    selectOps: {
      deselectAll: () => {
        if (instance.values.selectedBlocks.size > 0) {
          instance.values.selectingAll = false
          const selected = instance.values.selectedBlocks
          selected.forEach(i => {
            i.removeSelectedState?.()
            i.pathRef?.unref()
          })
          selected.clear()
        }
      },
      selectBlock: blockId => {
        const idArr = Array.isArray(blockId) ? blockId : [blockId]
        idArr.forEach(id => {
          instance.values.selectedBlocks.set(id, instance.values.selectedBlocks.get(id) || {})
          instance.blockOps?.getBlockFuncs(id)?.selectBlock()
        })
      }
    }
  })
  useEffect(() => {
    if (readonly) return
    const scrollElement = scrollElementRef.current
    if (scrollElement) {
      scrollElement.addEventListener('pointerdown', mouseDownHandler)
      document.addEventListener('pointermove', realMouseMoveHandler, true)
      document.addEventListener('pointerup', mouseUpHandler)
      document.addEventListener('keydown', keyDownHandler)
      return () => {
        scrollElement.removeEventListener('pointerdown', mouseDownHandler)
        document.removeEventListener('pointermove', realMouseMoveHandler, true)
        document.removeEventListener('pointerup', mouseUpHandler)
        document.removeEventListener('keydown', keyDownHandler)
      }
    }
  })
  const renderSelect = () => {
    if (selectArea) {
      return createPortal(
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
              ...selectArea,
              background: 'rgba(39, 158, 255, 0.2)',
              position: 'absolute',
              borderRadius: 0
            }}
          ></div>
        </div>,
        document.body
      )
    }
  }
  return {
    renderSelect
  }
}

export default useEditorSelect
