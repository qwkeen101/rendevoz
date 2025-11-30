import { Store } from 'jotai/vanilla'
import { IWhiteboardInstance } from '../../types'
import { ensureMap } from '../utils'
import { WhiteboardAtom } from '../store'
import { getBoxOfNodes } from '../../utils'

export const assignContainerOps = (instance: IWhiteboardInstance, store: Store) => {
  instance.containerOps = {
    fitToNode: id => {
      const value = store.get(WhiteboardAtom as any)
      const node = value.nodes?.get(id)
      if (!node) return
      const { width = 0, height = 0, x, y } = node
      instance.coordOps?.setTransform?.({
        x: -x + width,
        y: -y + height,
        scale: 1
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
      instance.containerOps?.fitToViewBox?.({
        x: box.left ?? box.x,
        y: box.top ?? box.y,
        width: box.width,
        height: box.height
      })
    },
    fitToViewBox: box => {
      const viewport = instance.coordOps?.getViewportBox?.()
      if (!viewport) return
      const scaleX = viewport.width / (box.width || 1)
      const scaleY = viewport.height / (box.height || 1)
      const scale = Math.min(scaleX, scaleY) * 0.8
      instance.coordOps?.setTransform?.({
        x: -box.x * scale + viewport.width / 2 - (box.width * scale) / 2,
        y: -box.y * scale + viewport.height / 2 - (box.height * scale) / 2,
        scale
      })
    }
  }
}
