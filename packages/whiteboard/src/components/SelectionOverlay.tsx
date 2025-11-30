import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useWhiteboardInstance, useWhiteboardSelection, useWhiteboardState } from '../hooks'
import { WhiteboardSelectionAtom } from '../core/store'
import { useStore } from 'jotai'

const SelectionOverlay = memo(() => {
  const instance = useWhiteboardInstance()
  const selection = useWhiteboardSelection()
  const store = useStore()
  const { lastViewport } = useWhiteboardState()
  const [dragging, setDragging] = useState(false)
  const [rect, setRect] = useState<{ x: number; y: number; width: number; height: number }>()
  const startPoint = useRef<{ x: number; y: number }>()

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[role="node"]')) return
      const container = instance.getOutestContainerNode?.()
      if (!container || !container.contains(target)) return
      const scale = lastViewport?.scale || 1
      startPoint.current = { x: e.clientX, y: e.clientY }
      setRect({ x: e.clientX, y: e.clientY, width: 0, height: 0 })
      setDragging(true)
      instance.selectOps?.clear?.()
      const move = (ev: PointerEvent) => {
        if (!startPoint.current) return
        const dx = ev.clientX - startPoint.current.x
        const dy = ev.clientY - startPoint.current.y
        setRect({
          x: Math.min(ev.clientX, startPoint.current.x),
          y: Math.min(ev.clientY, startPoint.current.y),
          width: Math.abs(dx),
          height: Math.abs(dy)
        })
        const selectionBox = {
          x: (Math.min(ev.clientX, startPoint.current.x) - (lastViewport?.x || 0)) / scale,
          y: (Math.min(ev.clientY, startPoint.current.y) - (lastViewport?.y || 0)) / scale,
          width: Math.abs(dx) / scale,
          height: Math.abs(dy) / scale
        }
        const nodes = instance.getAllNode?.() || []
        const selected = nodes.filter(n => {
          const width = n.width || 0
          const height = n.height || 0
          return (
            n.x < selectionBox.x + selectionBox.width &&
            n.x + width > selectionBox.x &&
            n.y < selectionBox.y + selectionBox.height &&
            n.y + height > selectionBox.y
          )
        })
        instance.selectOps?.setSelection?.({
          nodes: new Set(selected.map(n => n.id)),
          edges: new Set()
        })
      }
      const up = () => {
        setDragging(false)
        setRect(undefined)
        startPoint.current = undefined
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    }
    window.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [instance, lastViewport?.scale, lastViewport?.x, lastViewport?.y, store])

  const style = useMemo(() => {
    if (!rect || !dragging) return { display: 'none' }
    return {
      position: 'fixed' as const,
      left: rect.x,
      top: rect.y,
      width: rect.width,
      height: rect.height,
      border: '1px dashed #2e7dff',
      background: 'rgba(46, 125, 255, 0.08)',
      pointerEvents: 'none',
      zIndex: 3
    }
  }, [rect, dragging])

  return <div style={style} />
})

export default SelectionOverlay
