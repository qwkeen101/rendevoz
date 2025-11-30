import { Store } from 'jotai/vanilla'
import { IWhiteboardInstance } from '../../types'
import { WhiteboardStateAtom } from '../store'

export const assignCoordOps = (instance: IWhiteboardInstance, store: Store) => {
  instance.coordOps = {
    getTransform: () => store.get(WhiteboardStateAtom).lastViewport || { x: 0, y: 0, scale: 1 },
    setTransform: transform => {
      store.set(WhiteboardStateAtom, s => ({
        ...s,
        lastViewport: transform,
        zoom: transform.scale
      }))
      instance.emit?.({ type: 'panChange' })
      instance.emit?.({ type: 'zoomChange' })
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
    }
  }
}
