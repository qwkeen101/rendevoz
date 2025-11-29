import { Box, CustomElement, IEditorInstance } from '~/typings'
import { RefObject, useLayoutEffect, useRef, useState } from 'react'
import { useMemoizedFn, useMount, useUpdateEffect } from '@/hooks'
import { ReactEditor } from '@/core'
import {
  getDistanceBetweenElementAndScrollableElement,
  getDistanceBetweenPointAndScrollableElement
} from '@/core/components/editor/utils/scroll'
import { Editor, Range } from 'slate'
import { boxesIntersect } from '@/utils'

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
  isSelecting?: boolean
}) => {
  const { element, instance, blockRef, scrollElementRef, isSelecting } = opts
  const [isSelected, setIsSelected] = useState(false)
  const editor = instance.editor
  const boxRef = useRef<Box>()
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
  const handleCollisionSelectBlock = useMemoizedFn((box: Box) => {
    if (!boxRef.current) return
    if (!checkCanBeSelected()) return
    if (boxesIntersect(box, boxRef.current)) {
      !isSelected && setIsSelected(true)
    } else {
      isSelected && setIsSelected(false)
    }
  })
  useMount(() => {
    if (instance.values?.selectedBlocks.has(element.id)) {
      setIsSelected(true)
    }
  })
  useLayoutEffect(() => {
    if (isSelecting) {
      const block = blockRef.current
      if (block && scrollElementRef?.current) {
        const selectable = block.classList.contains('selectable') ? block : block.querySelector('.selectable')
        if (selectable) {
          const bounding = selectable.getBoundingClientRect()
          const distance = getDistanceBetweenPointAndScrollableElement(
            {
              x: bounding.left,
              y: bounding.top
            },
            scrollElementRef.current
          )
          boxRef.current = {
            left: distance.left,
            top: distance.top,
            width: bounding.width,
            height: bounding.height
          }
        }
      }
      return () => {
        boxRef.current = undefined
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
    deselectBlock: () => {
      setIsSelected(false)
    },
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
