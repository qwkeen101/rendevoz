import { Store } from 'jotai/vanilla'
import { IWhiteboardInstance } from '../../types'
import { getBoxOfNodes } from '../../utils'
import { WhiteboardAtom } from '../store'

export const assignContainerOps = (instance: IWhiteboardInstance, store: Store) => {
  instance.containerOps = {
    fitToNode: id => {
      const value = store.get(WhiteboardAtom as any)
      const node = value.nodes?.get(id)
      if (!node) return
      const { width = 0, height = 0, x, y } = node
      instance.containerOps?.fitTo?.({
        left: x,
        top: y,
        width,
        height
      })
    },
    fitToSelection: () => {
      const selection = instance.selectOps?.getSelection?.()
      if (!selection || selection.nodes.size === 0) return
      const value = store.get(WhiteboardAtom as any)
      const nodes = Array.from(selection.nodes)
        .map(id => value.nodes?.get(id))
        .filter(Boolean)
      const box = getBoxOfNodes(nodes as any)
      if (!box) return
      instance.containerOps?.fitTo?.({
        left: box.left ?? box.x,
        top: box.top ?? box.y,
        width: box.width,
        height: box.height
      })
    },
    fitToViewBox: box => {
      const viewport = instance.coordOps?.getViewportBox?.()
      const transform = instance.coordOps?.getTransform?.()
      if (!viewport || !transform) return
      const scaleX = viewport.width / (box.width || 1)
      const scaleY = viewport.height / (box.height || 1)
      const scale = Math.min(scaleX, scaleY) * 0.8
      instance.coordOps?.setTransform?.({
        x: -box.x * scale + viewport.width / 2 - (box.width * scale) / 2,
        y: -box.y * scale + viewport.height / 2 - (box.height * scale) / 2,
        scale
      })
    },
    fitTo: (box, opts) => {
      const viewport = instance.coordOps?.getViewportBox?.()
      const transform = instance.coordOps?.getTransform?.()
      if (!viewport || !transform) return
      const padding = Math.min(viewport.height, viewport.width) * 0.18
      const widthRatio = (viewport.width - padding) / (box.width || 1)
      const heightRatio = (viewport.height - padding) / (box.height || 1)
      const ratio = Math.min(widthRatio, heightRatio)
      const scale = opts?.changeScale === false ? transform.scale : Math.min(ratio, opts?.maxScale || ratio || 1)
      const centerX = (box.left ?? box.x ?? 0) + (box.width || 0) / 2
      const centerY = (box.top ?? box.y ?? 0) + (box.height || 0) / 2
      instance.coordOps?.setTransform?.({
        x: -centerX * scale + (viewport.width / scale / 2) * scale,
        y: -centerY * scale + (viewport.height / scale / 2) * scale,
        scale
      })
    },
    getViewBox: () => {
      const transform = instance.coordOps?.getTransform?.()
      const viewport = instance.coordOps?.getViewportBox?.()
      if (!transform || !viewport) return
      return {
        left: -transform.x / transform.scale,
        top: -transform.y / transform.scale,
        width: viewport.width / transform.scale,
        height: viewport.height / transform.scale
      }
    },
    getInViewNodes: fullyInView => {
      const value = store.get(WhiteboardAtom as any)
      const viewBox = instance.containerOps?.getViewBox?.()
      if (!viewBox) return []
      return Array.from(value.nodes?.values() || []).filter(node => {
        const nodeBox = {
          left: node.x,
          top: node.y,
          width: node.width ?? 0,
          height: node.height ?? 0
        }
        if (fullyInView) {
          return (
            nodeBox.left >= viewBox.left &&
            nodeBox.top >= viewBox.top &&
            nodeBox.left + nodeBox.width <= viewBox.left + viewBox.width &&
            nodeBox.top + nodeBox.height <= viewBox.top + viewBox.height
          )
        }
        return !(
          nodeBox.left + nodeBox.width < viewBox.left ||
          nodeBox.left > viewBox.left + viewBox.width ||
          nodeBox.top + nodeBox.height < viewBox.top ||
          nodeBox.top > viewBox.top + viewBox.height
        )
      })
    },
    setTransform: (t, skipAnimation) => {
      if (skipAnimation) {
        instance.coordOps?.setTransform?.(t)
        return
      }
      instance.coordOps?.setTransform?.(t)
    },
    moveBy: (x, y) => {
      const current = instance.coordOps?.getTransform?.()
      if (!current) return
      instance.coordOps?.setTransform?.({
        ...current,
        x: current.x + x,
        y: current.y + y
      })
    }
  }
}
