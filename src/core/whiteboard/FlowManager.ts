import { globalStore, ObjectStore } from '@/stores'
import { Position } from '@/types'
import produce from 'immer'
import { PanZoom } from 'panzoom'
import { IWhiteboardNode } from '~/typings/data'
import { Box, Point } from '~/typings'

class FlowManager {
  public whiteboardId?: number

  public ID_TO_NODE_ELEMENT_MAP = new Map<
    number,
    {
      element?: HTMLElement | null
      checkSelectIntersection: () => Box | undefined
      sizeAlreadyDefined: () => boolean
      boxIntersect: (box: Box) => boolean
      getNode: () => IWhiteboardNode
    }
  >()

  public ID_TO_EDGE_MAP = new Map<
    number,
    {
      element?: SVGPathElement | null
      drawPath: VoidFunction
    }
  >()

  public NODE_TO_EDGE_MAP = new Map<number, Set<number>>()

  public containerEle?: HTMLElement

  public parentContainerEle?: HTMLElement

  public containerTransformScale = 1

  public isAddingEdge = false

  public isDraggingNode = false

  public updateNodePosition = (nodeId: number, newPos: Position) => {}

  public selectable = false

  public selectStartPoint?: Point

  public selectEndPoint?: Point

  public selectBox?: Box

  public panzoom?: PanZoom

  public resizeObserver = new ResizeObserver(entries => {
    if (this.whiteboardId) {
      for (const entry of entries) {
        const target = entry.target
        const nodeId = Number(target.getAttribute('data-node-id'))
        if (this.ID_TO_NODE_ELEMENT_MAP.get(nodeId)?.sizeAlreadyDefined()) {
          return
        }
        const whiteboard = globalStore.get(ObjectStore('whiteboard').objectMapAtom).get(this.whiteboardId)
        const node = whiteboard?.nodes?.get(nodeId)
        if (node) {
          const box = entry.contentRect
          const newWhiteboard = produce(whiteboard, draft => {
            draft?.nodes?.set(nodeId, {
              ...node,
              width: box.width,
              height: box.height
            })
          })

          ObjectStore('whiteboard').updateOne(newWhiteboard, { silent: true })
        }
      }
    }
  })

  public isSelecting = false

  public hasMultiSelectBox = false

  public isMovingMultiSelectBox = false

  public selectedNodeIds = new Set<number>()

  public onNodeFocus?: (n: IWhiteboardNode) => void
}

export default FlowManager
