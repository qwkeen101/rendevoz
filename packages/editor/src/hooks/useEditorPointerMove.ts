import { RefObject, useEffect } from 'react'
import { useMemoizedFn } from '@/hooks'
import getEditorBlockHandle from '../hooks/getEditorBlockHandle'
import useThrottleFn from '@/hooks/utils/useThrottleFn'
import { useSetAtom, useStore } from 'jotai'
import { EditorStateAtom } from '../hooks/useEditorState'
import { EditorBlockHandleAtom } from '../hooks/useBlockHandle'
import { CustomEditor, IEditorInstance } from '~/typings'
import { isGlobalDragging } from '@/core'
import { EditorisSelectingAtom } from '../hooks/useIsSelecting'

export default (instance: IEditorInstance, editor: CustomEditor, ref: RefObject<HTMLDivElement>) => {
  const store = useStore()
  const setBlockHandle = useSetAtom(EditorBlockHandleAtom)
  const handleContainerPointerMove = useMemoizedFn((e: PointerEvent) => {
    const editorState = store.get(EditorStateAtom)
    const blockHandleState = store.get(EditorBlockHandleAtom)
    const isDraggingDivider = editorState.isDraggingDivider
    const readOnly = editorState.readOnly
    const isSelecting = store.get(EditorisSelectingAtom)
    if (!isDraggingDivider && !readOnly) {
      if (!e.currentTarget) return
      const isVisible = blockHandleState.visible === true
      if (isSelecting) {
        if (isVisible) {
          setBlockHandle(s => ({ ...s, visible: false }))
        }
        return
      }
      if (!ref.current?.contains(e.target)) {
        if (isVisible) {
          setBlockHandle(s => ({ ...s, visible: false }))
        }
        return
      }
      const result = getEditorBlockHandle(e, instance, editor)
      if (!result) {
        if (isVisible) {
          setBlockHandle(s => ({ ...s, visible: false }))
        }
        return
      }
      const element = result.element
      editor.currentEnterElement = element
      // if dragging, disable set block handle
      if (isGlobalDragging()) return
      const targetEle =
        (result.node.classList.contains('selectable') ? result.node : result.node.querySelector('.selectable')) || result.node
      if (!targetEle) return
      setBlockHandle(s => {
        const scrollEle = ref.current!
        const scrollBounding = scrollEle.getBoundingClientRect()
        const scrollElementRect = {
          left: scrollEle.offsetLeft,
          top: scrollEle.offsetTop,
          width: scrollEle.offsetWidth,
          height: scrollEle.offsetHeight
        }
        const targetBounding = targetEle.getBoundingClientRect()
        const targetRect = {
          left: targetEle.offsetLeft,
          top: targetEle.offsetTop,
          width: targetEle.offsetWidth,
          height: targetEle.offsetHeight
        }
        const targetLeft = ((targetBounding.x - scrollBounding.x) / scrollBounding.width) * scrollElementRect.width
        const targetTop = ((targetBounding.y - scrollBounding.y) / scrollBounding.height) * scrollElementRect.height + scrollEle.scrollTop
        let left = targetLeft - 4
        let top = targetTop
        const targetLineHeight = parseInt(window.getComputedStyle(targetEle.firstElementChild).lineHeight)
        top += (targetLineHeight - 24) / 2
        return {
          ...s,
          left,
          top,
          targetId: element.id,
          targetHeight: targetRect.height,
          visible: true,
          showAdd: editorState.layout?.showBlockHandleAdd !== false
        }
      })
    }
  })
  const { run } = useThrottleFn(handleContainerPointerMove, { wait: 10 })
  useEffect(() => {
    const ele = ref.current
    if (ele) {
      ele.addEventListener('pointermove', run)
      return () => ele.removeEventListener('pointermove', run)
    }
  })
}
