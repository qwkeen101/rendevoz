import { CustomElement, IEditorInstance } from '~/typings'
import useIsSelecting from '@/core/editor/hooks/useIsSelecting'
import { RefObject, useLayoutEffect, useRef, useState } from 'react'
import { useMemoizedFn, useMount, useUpdateEffect } from '@/hooks'
import { ReactEditor, SELECT_AREA_MAP } from '@/core'
import { isRectsCollision } from '@/core/editor/utils/positions/collision'
import { getDistanceBetweenElementAndScrollableElement } from '@/core/editor/utils/scroll'
import { Editor } from 'slate'

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
  const { type } = element

  const editor = instance.getSlateEditor?.()
  const distanceToScrollElementRef = useRef<{
    left: number
    top: number
    right: number
    bottom: number
  }>()
  const handleCollisionSelectBlock = useMemoizedFn(() => {
    if (type === 'column' || type === 'columnList' || !editor) return
    const selectArea = SELECT_AREA_MAP.get(editor)
    if (!selectArea || !distanceToScrollElementRef.current) return
    if (blockRef.current?.parentElement?.closest('[data-spec-type="table"]')) return
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
        distanceToScrollElementRef.current = getDistanceBetweenElementAndScrollableElement(block, scrollElementRef.current)
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
      if (
        blockRef.current?.parentElement?.closest('[data-spec-type="table"]') ||
        element.type === 'column' ||
        element.type === 'columnList'
      ) {
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
      if (
        blockRef.current?.parentElement?.closest('[data-spec-type="table"]') ||
        element.type === 'column' ||
        element.type === 'columnList'
      ) {
        setIsSelected(false)
        return
      }
      setIsSelected(true)
    }
  }
}

export default useBlockSelect
