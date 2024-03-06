import { CustomEditor } from '~/typings'
import { SELECT_AREA_MAP } from '@/core'
import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import useIsSelecting from '@/core/components/editor/hooks/useIsSelecting'

const EditorSelectArea = ({ editor, scrollElement }: { editor: CustomEditor; scrollElement?: HTMLElement | null }) => {
  const [selectArea, setSelectArea] = useState<any>()
  const framerIdRef = useRef(0)
  const [isSelecting] = useIsSelecting()
  useLayoutEffect(() => {
    const changeSelectArea = () => {
      const selectArea = SELECT_AREA_MAP.get(editor)
      if (selectArea && scrollElement) {
        const width = selectArea.right - selectArea.left
        const height = selectArea.bottom - selectArea.top
        const scrollElementRect = scrollElement.getBoundingClientRect()
        const left = scrollElementRect.left + selectArea.left
        const top = scrollElementRect.top + selectArea.top - scrollElement.scrollTop
        setSelectArea({ left, top, width, height })
      } else {
        setSelectArea(undefined)
      }
      framerIdRef.current = requestAnimationFrame(changeSelectArea)
    }
    if (isSelecting) {
      changeSelectArea()
    }
    return () => {
      cancelAnimationFrame(framerIdRef.current)
    }
  }, [editor, scrollElement, isSelecting])
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
      {selectArea && (
        <div
          style={{
            ...selectArea,
            background: 'rgba(39, 158, 255, 0.2)',
            position: 'absolute',
            borderRadius: 0
          }}
        ></div>
      )}
    </div>,
    document.body,
    'editorOverlay'
  )
}

export default EditorSelectArea
