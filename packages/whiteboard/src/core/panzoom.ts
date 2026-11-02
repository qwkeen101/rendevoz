import { RefObject, useEffect, useRef } from 'react'
import { IWhiteboardInstance, IWhiteboardTransform } from '../types'
import { createStore } from 'jotai'
import { WhiteboardStateAtom } from './store'

const MIN_ZOOM = 0.25
const MAX_ZOOM = 3
const ZOOM_SPEED = 1
const DEFAULT_VIEWPORT: IWhiteboardTransform = { x: 0, y: 0, scale: 1 }

type Store = ReturnType<typeof createStore>

type UsePanzoomParams = {
  containerRef: RefObject<HTMLElement>
  transformRef?: RefObject<HTMLElement>
  instance: IWhiteboardInstance
  store: Store
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const getScaleMultiplier = (delta: number) => {
  const sign = Math.sign(delta)
  const deltaAdjustedSpeed = Math.min(0.25, Math.abs((ZOOM_SPEED * delta) / 128))
  return 1 - sign * deltaAdjustedSpeed
}

export const usePanzoom = ({ containerRef, transformRef, instance, store }: UsePanzoomParams) => {
  const pointerRef = useRef<{ active: boolean; lastX: number; lastY: number; pointerId?: number }>({
    active: false,
    lastX: 0,
    lastY: 0
  })
  const viewportRef = useRef<IWhiteboardTransform>(DEFAULT_VIEWPORT)
  const rafRef = useRef<{ id: number | null; syncState: boolean }>({ id: null, syncState: false })
  const transformTargetRef = useRef<HTMLElement | null>(null)

  // Handle space key to toggle pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target as HTMLElement)?.closest('input,textarea,[contenteditable]')) {
        const state = store.get(WhiteboardStateAtom)
        if (state.pointerMode !== 'pan') {
          store.set(WhiteboardStateAtom, s => ({ ...s, pointerMode: 'pan' }))
          if (containerRef.current) {
            containerRef.current.style.cursor = 'grab'
          }
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        store.set(WhiteboardStateAtom, s => ({ ...s, pointerMode: s.toolbarPointerMode || 'select' }))
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default'
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [store, containerRef])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    transformTargetRef.current = transformRef?.current || el
    viewportRef.current = store.get(WhiteboardStateAtom).lastViewport || DEFAULT_VIEWPORT

    const applyTransform = (next: IWhiteboardTransform) => {
      const target = transformTargetRef.current
      if (!target) return
      target.style.transform = `translate(${next.x}px, ${next.y}px) scale(${next.scale})`
      target.style.transformOrigin = '0 0'

      // 触发实时 viewport 变化事件
      instance.emit?.({
        type: 'viewportChange',
        viewport: next
      })
    }

    const commitState = (next: IWhiteboardTransform) => {
      store.set(WhiteboardStateAtom, s => ({
        ...s,
        lastViewport: next,
        zoom: next.scale
      }))
      instance.emit?.({ type: 'panChange' })
      instance.emit?.({ type: 'zoomChange' })
    }

    const scheduleRender = (syncState: boolean) => {
      rafRef.current.syncState = rafRef.current.syncState || syncState
      if (rafRef.current.id !== null) return
      rafRef.current.id = window.requestAnimationFrame(() => {
        rafRef.current.id = null
        applyTransform(viewportRef.current)
        if (rafRef.current.syncState) {
          commitState(viewportRef.current)
          rafRef.current.syncState = false
        }
      })
    }

    const stopPanning = () => {
      const state = pointerRef.current
      if (!state.active) return
      state.active = false
      if (state.pointerId !== undefined) {
        el.releasePointerCapture?.(state.pointerId)
      }
      const mode = store.get(WhiteboardStateAtom).pointerMode
      el.style.cursor = mode === 'pan' ? 'grab' : 'default'
      scheduleRender(true)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }

    const handlePointerDown = (e: PointerEvent) => {
      const state = store.get(WhiteboardStateAtom)
      if (state.readOnly) return

      const allowPan = state.pointerMode === 'pan' || e.button === 1 || e.button === 2
      if (!allowPan) return

      pointerRef.current = {
        active: true,
        lastX: e.clientX,
        lastY: e.clientY,
        pointerId: e.pointerId
      }
      el.setPointerCapture?.(e.pointerId)
      el.style.cursor = 'grabbing'
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
      e.preventDefault()
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!pointerRef.current.active) return

      const dx = e.clientX - pointerRef.current.lastX
      const dy = e.clientY - pointerRef.current.lastY
      if (dx === 0 && dy === 0) return

      pointerRef.current.lastX = e.clientX
      pointerRef.current.lastY = e.clientY

      viewportRef.current = {
        ...viewportRef.current,
        x: viewportRef.current.x + dx,
        y: viewportRef.current.y + dy
      }
      scheduleRender(false)
    }

    const handlePointerUp = () => {
      stopPanning()
    }

    const handleWheel = (e: WheelEvent) => {
      const state = store.get(WhiteboardStateAtom)
      if (state.readOnly) return

      const shouldZoom = state.pointerMode === 'pan' || e.ctrlKey || e.metaKey
      if (!shouldZoom && e.deltaX === 0 && e.deltaY === 0) return

      const current = viewportRef.current

      if (shouldZoom) {
        const scaleMultiplier = getScaleMultiplier(e.deltaY)
        const nextScale = clamp(current.scale * scaleMultiplier, MIN_ZOOM, MAX_ZOOM)
        const ratio = nextScale / current.scale
        if (!isFinite(ratio) || ratio === 1) return

        const rect = el.getBoundingClientRect()
        const point = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }

        viewportRef.current = {
          x: point.x - ratio * (point.x - current.x),
          y: point.y - ratio * (point.y - current.y),
          scale: nextScale
        }
        scheduleRender(true)
        return
      }

      viewportRef.current = {
        ...current,
        x: current.x - e.deltaX,
        y: current.y - e.deltaY
      }
      scheduleRender(true)
    }

    // Apply initial transform from state
    applyTransform(viewportRef.current)

    el.addEventListener('wheel', handleWheel, { passive: true })
    el.addEventListener('pointerdown', handlePointerDown)

    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      if (rafRef.current.id !== null) {
        cancelAnimationFrame(rafRef.current.id)
        rafRef.current.id = null
      }
    }
  }, [containerRef, transformRef, instance, store])
}
