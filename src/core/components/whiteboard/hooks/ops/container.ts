import { Box, IWhiteboardInstance } from '~/typings'
import { assignProperties, boxContain, boxesIntersect } from '@/utils'
import { useFlow } from '@/core/components/whiteboard/StateHooks'
import { getBoxOfNodes } from '@/core/components/whiteboard/utils'
import { isEqual } from 'lodash'

const assignContainerOps = (instance: IWhiteboardInstance) => {
  const flow = useFlow()
  // node: 106 417
  // left top: -58 -227 0.55
  // center: 717 112
  // bounding: 1537 837 * 0.55 -> 845 460
  assignProperties(instance, {
    containerOps: {
      fitToNode: nodeId => {
        const n = instance.getNode?.(nodeId)
        if (n) {
          instance.containerOps?.fitTo?.({
            left: n.x,
            top: n.y,
            width: n.width ?? 0,
            height: n.height ?? 0
          })
        }
      },
      undoTransform: () => {
        if (instance.values.transformHistory.undos.length > 1) {
          const last = instance.values.transformHistory.undos.pop()
          // instance.values.transformHistory.redos.push(last)
          instance.containerOps?.setTransform(instance.values.transformHistory.undos[instance.values.transformHistory.undos.length - 1])
          if (instance.values.transformHistory.undos.length === 1) {
            instance.values.transformHistory.undos.pop()
          }
        }
      },
      redoTransform: () => {
        if (instance.values.transformHistory.redos.length) {
          const last = instance.values.transformHistory.redos.pop()
          instance.values.transformHistory.undos.push(last)
          instance.containerOps?.setTransform(last)
        }
      },
      getViewBox: () => {
        const transform = instance.getTransform?.()
        if (!transform) throw 'Failed to find container node!'
        const containerBounding = instance.getOutestContainerNode?.().getBoundingClientRect()
        if (!containerBounding) throw 'Failed to find container node!'
        const inViewBox: Box = {
          left: -transform.x / transform.scale,
          top: -transform.y / transform.scale,
          width: containerBounding.width / transform.scale,
          height: containerBounding.height / transform.scale
        }
        return inViewBox
      },
      getInViewNodes: fullyInView => {
        const inViewBox = instance.containerOps?.getViewBox()
        if (!inViewBox) throw 'Failed to get view box!'
        const allNodes = instance.getAllNode?.()
        if (!allNodes) throw 'Failed to get nodes'
        return allNodes?.filter(i => {
          const nodeBox = {
            left: i.x,
            top: i.y,
            width: i.width,
            height: i.height
          }
          if (fullyInView) {
            return boxContain(inViewBox, nodeBox)
          }
          return boxesIntersect(inViewBox, nodeBox)
        })
      },
      setTransform: t => {
        flow.panzoom?.setTransform(t)
      },
      fitTo: (box, opts) => {
        const container = instance.getContainerNode?.().parentElement
        if (container) {
          const bounding = container.getBoundingClientRect()
          const padding = Math.min(bounding.height, bounding.width) * 0.18
          const widthRatio = (bounding.width - padding) / box.width
          const heightRatio = (bounding.height - padding) / box.height
          const ratio = Math.min(widthRatio, heightRatio)
          const boxTop = box.top + box.height / 2
          const boxCenterHori = box.left + box.width / 2
          const currentTransform = instance.getTransform?.()

          if (currentTransform) {
            if (ratio && currentTransform) {
              const s = opts?.changeScale === false ? currentTransform.scale : Math.min(ratio, opts?.maxScale || 1.2)
              const pos = {
                x: -boxCenterHori * s + (bounding.width / s / 2) * s,
                y: -boxTop * s + (bounding.height / s / 2) * s
              }
              const lastUndo = instance.values.transformHistory.undos[instance.values.transformHistory.undos.length - 1]
              let pushCurr = true

              if (lastUndo) {
                if (JSON.stringify(lastUndo) === JSON.stringify(currentTransform)) {
                  pushCurr = false
                }
              }
              if (pushCurr) {
                // if curr not equals undo last transform, clear transform
                instance.values.transformHistory.undos.push(structuredClone(currentTransform))
              }
              instance.values.transformHistory.undos.push(
                structuredClone({
                  x: pos.x,
                  y: pos.y,
                  scale: s
                })
              )
              flow.panzoom?.setTransform({
                x: pos.x,
                y: pos.y,
                scale: s
              })
            }
          }
        }
      },
      fitToSelected: () => {
        const selected = instance.selectOps?.getSelectedNodes()
        console.log(selected)
        if (selected?.length) {
          const box = getBoxOfNodes(selected)
          box && instance.containerOps?.fitTo(box)
          console.log('get ere')
        }
      },
      zoomTo: () => {}
    }
  })
}

export default assignContainerOps
