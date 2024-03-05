import { CustomElement, IEditorInstance } from '~/typings'
import useIsSelecting from '@/core/components/editor/hooks/useIsSelecting'
import { RefObject, useLayoutEffect, useRef, useState } from 'react'
import { useMemoizedFn, useMount, useUpdateEffect } from '@/hooks'
import { ReactEditor, SELECT_AREA_MAP } from '@/core'
import { isRectsCollision } from '@/core/components/editor/utils/positions/collision'
import { getDistanceBetweenElementAndScrollableElement } from '@/core/components/editor/utils/scroll'
import { Editor, Range } from 'slate'

/**
 * Nested blocks can't be selected
 * Eg: blocks in table
 *
 */
const useBlockSelect = (opts: {
  element: CustomElement
  instance: IEditorInstance
  blockRef: RefObject<HTMLElement>
  scrollElementRef: RefObject<HTMLElement>
}) => {
  const { element, instance, blockRef, scrollElementRef } = opts
  const [isSelecting] = useIsSelecting()
  const [isSelected, setIsSelected] = useState(false)
  const editor = instance.getSlateEditor?.()
  if (isSelected) {
    console.log(element, instance.values.selectedBlocks)
  }
  const distanceToScrollElementRef = useRef<{
    left: number
    top: number
    right: number
    bottom: number
  }>()
  const checkCanBeSelected = () => {
    const blockContainer = blockRef.current?.parentElement
    if (!blockContainer) return false
    if (blockContainer.closest('[data-spec-type="table"]') || element.type === 'column' || element.type === 'columnList') {
      return false
    }
    const sync = blockRef.current?.closest('[data-spec-type="synced"]')
    if (sync && editor) {
      const syncRange = Editor.range(editor, ReactEditor.findPath(editor, ReactEditor.toSlateNode(editor, sync)))
      const syncFocused =
        editor.selection &&
        syncRange &&
        Range.includes(syncRange, Range.start(editor.selection)) &&
        Range.includes(syncRange, Range.end(editor.selection))
      if (syncFocused) {
        if (element.type === 'synced') {
          return false
        }
        return true
      } else if (element.type === 'synced') {
        return true
      }
      return false
    }
    return true
  }
  const handleCollisionSelectBlock = useMemoizedFn(() => {
    const selectArea = SELECT_AREA_MAP.get(editor)
    if (!selectArea || !distanceToScrollElementRef.current) return
    if (!checkCanBeSelected()) return
    if (isRectsCollision(selectArea, distanceToScrollElementRef.current)) {
      setIsSelected(true)
    } else {
      setIsSelected(false)
    }
  })
  useMount(() => {
    if (instance.values?.selectedBlocks.has(element.id)) {
      setIsSelected(true)
    } else {
      setIsSelected(false)
    }
  })
  useLayoutEffect(() => {
    if (isSelecting) {
      const block = blockRef.current
      if (block && scrollElementRef?.current) {
        const selectable = block.classList.contains('selectable') ? block : block.querySelector('.selectable')
        if (selectable) {
          distanceToScrollElementRef.current = getDistanceBetweenElementAndScrollableElement(selectable, scrollElementRef.current)
        }
      }
      return () => {
        distanceToScrollElementRef.current = undefined
      }
    }
  }, [isSelecting])

  useUpdateEffect(() => {
    const selectedBlockMap = instance.values.selectedBlocks
    if (isSelected) {
      const currentSelected = selectedBlockMap.get(element.id)
      if (currentSelected?.pathRef) {
        currentSelected.pathRef.unref()
      }
      if (!checkCanBeSelected()) {
        setIsSelected(false)
        return
      }

      const currentPath = ReactEditor.findPath(editor, element)
      selectedBlockMap.set(element.id, {
        element,
        pathRef: Editor.pathRef(editor, currentPath),
        removeSelectedState: () => setIsSelected(false),
        node: blockRef.current
      })
    } else {
      const currentSelected = selectedBlockMap.get(element.id)
      if (currentSelected?.pathRef) {
        currentSelected.pathRef.unref()
      }
      selectedBlockMap.delete(element.id)
    }
  }, [isSelected, element])
  return {
    isSelected,
    handleCollisionSelectBlock,
    selectBlock: () => {
      if (!checkCanBeSelected()) {
        setIsSelected(false)
        return
      }
      setIsSelected(true)
    }
  }
}

export default useBlockSelect
