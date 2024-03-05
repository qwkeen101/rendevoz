import { useSelectAtomValue } from '@/hooks'
import { TableStateAtom } from '@/core/components/editor/elements/table/Table'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ReactEditor, useSlateStatic } from '@/core'
import { getBoxOfBoxes } from '@/core/components/whiteboard/utils'
import { Box } from '~/typings'
import tinycolor from 'tinycolor2'
import { Colors } from '@/consts'

export default () => {
  const selectionState = useSelectAtomValue(TableStateAtom, s => s.selectionState)
  const isReordering = useSelectAtomValue(TableStateAtom, s => s.isReordering)
  const [selectionBox, setSelectionBox] = useState<Box>()
  const boxRef = useRef<HTMLDivElement>(null)
  const offset = useSelectAtomValue(TableStateAtom, s => s.selectionBoxOffset)
  const editor = useSlateStatic()
  const overlayRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (selectionState?.length) {
      const boundings: DOMRect[] = []
      selectionState.forEach(n => {
        try {
          const dom = ReactEditor.toDOMNode(editor, n.element)
          boundings.push(dom.getBoundingClientRect())
        } catch (e) {}
      })
      const finalBox = getBoxOfBoxes(boundings)
      const container = overlayRef.current
      if (container && finalBox) {
        const containerBox = container.getBoundingClientRect()
        const scale = container.clientWidth / containerBox.width
        const offsetBox = {
          left: (finalBox.left - containerBox.left) * scale,
          top: (finalBox.top - containerBox.top) * scale,
          width: finalBox.width * scale,
          height: finalBox.height * scale
        }
        setSelectionBox(offsetBox)
      }
    } else {
      setSelectionBox(undefined)
    }
  }, [selectionState])
  useEffect(() => {
    if (selectionState) {
      const box = boxRef.current
      if (box) {
        const nodes: HTMLElement[] = []
        selectionState.forEach(n => {
          try {
            const dom = ReactEditor.toDOMNode(editor, n.element)
            nodes.push(dom)
          } catch (e) {}
        })
        const boxBounding = box.getBoundingClientRect()
        const scale = box.clientWidth / boxBounding.width
        nodes.forEach(n => {
          const cloned = n.cloneNode(true)
          const nBounding = n.getBoundingClientRect()
          const style = (cloned as HTMLElement).style
          style.position = 'absolute'
          style.left = `${(nBounding.left - boxBounding.left) * scale}px`
          style.top = `${(nBounding.top - boxBounding.top) * scale}px`
          style.width = `${n.clientWidth}px`
          style.height = `${n.clientHeight}px`
          style.transform = 'translate(0.5px,0.5px)'
          style.border = 'unset'
          style.opacity = '0.8'
          style.boxShadow = '0px 0px 0px 1px var(--border-background)'
          ;(cloned as HTMLElement).querySelectorAll('[role="drag-handle"]').forEach(i => {
            if (!(i as HTMLElement).hasAttribute('data-pressed')) {
              i.remove()
            } else {
              i.style.color = 'white'
              i.style.background = 'var(--select-color)'
            }
          })
          box.firstElementChild?.appendChild(cloned)
        })
      }
    }
  }, [selectionBox])
  useLayoutEffect(() => {
    if (isReordering && selectionState) {
      const nodes: HTMLElement[] = []
      selectionState.forEach(n => {
        try {
          const dom = ReactEditor.toDOMNode(editor, n.element)
          nodes.push(dom)
        } catch (e) {}
      })
      nodes.forEach(n => {
        n.style.visibility = 'hidden'
      })
      return () => {
        nodes.forEach(n => {
          n.style.visibility = 'visible'
        })
      }
    }
  }, [isReordering])
  const transparent = useMemo(() => {
    const bg = window.getComputedStyle(document.body).getPropertyValue('--global-background')
    const t = tinycolor(bg).setAlpha(0.8).toRgbString()
    return t
  }, [isReordering])
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }} ref={overlayRef}>
      {selectionBox && (
        <div
          ref={boxRef}
          style={{
            ...selectionBox,
            left: `min(calc(100% - ${selectionBox.width}px), ${Math.max(0, selectionBox.left - (offset?.left ?? 0))}px)`,
            top: `min(calc(100% - ${selectionBox.height}px), ${Math.max(0, selectionBox.top - (offset?.top ?? 0))}px)`,
            position: 'absolute',
            opacity: isReordering ? 1 : 0,
            boxShadow: '0px 0px 0px 2px var(--select-color)'
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              background: transparent,
              boxShadow: Colors.Background.BoxShadow
            }}
          ></div>
        </div>
      )}
    </div>
  )
}
