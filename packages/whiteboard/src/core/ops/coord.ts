import { createStore } from 'jotai/vanilla'
import { IWhiteboardInstance, WhiteboardState } from '../../types'
import { WhiteboardStateAtom } from '../store'

export const assignCoordOps = (instance: IWhiteboardInstance, store: ReturnType<typeof createStore>) => {
  instance.coordOps = {
    getTransform: () => store.get(WhiteboardStateAtom).lastViewport || { x: 0, y: 0, scale: 1 },
    setTransform: transform => {
      store.set(WhiteboardStateAtom, (s: WhiteboardState) => ({
        ...s,
        lastViewport: transform,
        zoom: transform.scale
      }))
      instance.emit?.({ type: 'panChange' })
      instance.emit?.({ type: 'zoomChange' })
    },
    transformWhiteboardRectToWindowRect: rect => {
      const el = instance.getOutestContainerNode?.()
      const transform = store.get(WhiteboardStateAtom).lastViewport
      if (!el || !transform) {
        throw new Error('Failed to transform coordinate!')
      }
      const bounding = el.getBoundingClientRect()
      return {
        left: rect.left * transform.scale + bounding.x + transform.x,
        top: rect.top * transform.scale + bounding.y + transform.y,
        width: rect.width * transform.scale,
        height: rect.height * transform.scale
      }
    },
    transformWhiteboardPositionToWindowPosition: pos => {
      const el = instance.getOutestContainerNode?.()
      const transform = store.get(WhiteboardStateAtom).lastViewport
      if (!el || !transform) {
        throw new Error('Failed to transform coordinate!')
      }
      const bounding = el.getBoundingClientRect()
      return {
        x: pos.x * transform.scale + bounding.x + transform.x,
        y: pos.y * transform.scale + bounding.y + transform.y
      }
    },
    getViewportBox: () => {
      const el = instance.getOutestContainerNode?.()
      if (!el) return
      const rect = el.getBoundingClientRect()
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top
      }
    },
    transformWindowPositionToPosition: (pos: { x: number; y: number }) => {
      const el = instance.getOutestContainerNode?.()
      const transform = store.get(WhiteboardStateAtom).lastViewport
      if (!el || !transform) {
        throw new Error('Failed to transform coordinate!')
      }
      const rect = el.getBoundingClientRect()
      return {
        x: (pos.x - rect.x - transform.x) / transform.scale,
        y: (pos.y - rect.y - transform.y) / transform.scale
      }
    }
  }
}
