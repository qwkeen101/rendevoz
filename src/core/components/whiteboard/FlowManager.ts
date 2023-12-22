import { ObjectStore } from '@/api/stores'
import produce, { Draft, Patch, produceWithPatches } from 'immer'
import { PanZoom } from 'panzoom'
import { IWhiteboard, IWhiteboardInstance, IWhiteboardNode } from '~/typings/data'
import { Box, Point, Size, XYPosition } from '~/typings'
import { transformXY } from '@/core/components/whiteboard/utils'
import { useSetWhiteboardNodes } from '@/core/components/whiteboard/StateHooks'
import { debounce } from 'lodash'
import { trimNumber } from '@/utils'
import { DEFAULT_NODE_PADDING } from '@/core/components/whiteboard/node/hooks/useNodeSize'

type HistoryItem = {
  patches: Patch[]
  inversePatches: Patch[]
}

class FlowManager {
  public whiteboardId?: number
  private intervalId: ReturnType<typeof setInterval> | undefined
  public focused = false
  public clearSelectBox?: VoidFunction
  private instance: IWhiteboardInstance
  constructor(instance: IWhiteboardInstance) {
    // loop to avoid nodes without width & height
    this.intervalId = setInterval(() => {
      const nodesToUpdate = []
      this.ID_TO_NODE_ELEMENT_MAP.forEach(v => {
        const node = v.getNode()
        if (!node.width || !node.height) {
          const latestSize = v.getLatestSize()
          if (latestSize.width && latestSize.height) {
            nodesToUpdate.push({
              id: node.id,
              ...latestSize
            })
          }
        }
      })
      if (nodesToUpdate.length && this.setNodes) {
        this.setNodes(s =>
          produce(s, draft => {
            nodesToUpdate.forEach(n => {
              draft.set(n.id, {
                ...draft.get(n.id),
                ...n
              })
            })
          })
        )
      }
    }, 1000)
    this.instance = instance
  }
  public ID_TO_NODE_ELEMENT_MAP = new Map<
    number,
    {
      element?: HTMLElement | null
      checkSelectIntersection: () => Box | undefined
      sizeAlreadyDefined: () => boolean
      boxIntersect: (box: Box) => boolean
      getNode: () => IWhiteboardNode
      getLatestSize: () => Box
      updateSize: (size: XYPosition & Size) => void
    }
  >()

  public updates: HistoryItem[] = []
  public pushUpdates = (item: HistoryItem) => {
    if (item.patches.length && item.inversePatches.length) {
      this.updates.push(item)
      this.history.redos = []
      this.debounceHandleHistory()
    }
  }
  public undo?: VoidFunction
  public redo?: VoidFunction
  private debounceHandleHistory = debounce(() => {
    if (!this.updates.length) return
    if (this.history.undos.length > 100) {
      this.history.undos.unshift()
    }
    const combinedUpdates: HistoryItem = {
      patches: [],
      inversePatches: []
    }
    this.updates.forEach(u => {
      combinedUpdates.patches = [...combinedUpdates.patches, ...u.patches]
      combinedUpdates.inversePatches = [...u.inversePatches, ...combinedUpdates.inversePatches]
    })
    console.log(combinedUpdates, this.updates)
    this.history.undos.push(combinedUpdates)
    this.updates = []
    this.history.redos = []
  }, 50)

  public history = {
    redos: [] as HistoryItem[],
    undos: [] as HistoryItem[]
  }

  public containerEle?: HTMLElement

  public parentContainerEle?: HTMLElement

  public containerTransformScale = 1

  public isAddingEdge = false

  public isDraggingNode = false

  public selectStartPoint?: Point

  public selectEndPoint?: Point

  public selectBox?: Box

  public panzoom?: PanZoom

  public dispose() {
    clearInterval(this.intervalId)
  }

  // for batch updating
  public isUpdatingState = false
  // cache updates within one micro task to prevent conflicts
  public cachedUpdatesRequest = []

  public resizeObserver = new ResizeObserver(entries => {
    // do not update values if resizing using selection box
    if (this.instance.values.isResizingSelectionBox) return
    const batchNewSize: { id: number; width?: number; height?: number }[] = []
    for (const entry of entries) {
      const target = entry.target
      const nodeId = Number(target.getAttribute('data-node-id'))
      if (this.instance.values.ID_TO_NODE_MAP.get(nodeId)?.sizeAlreadyDefined()) {
        return
      }
      const node = this.instance.getNode?.(nodeId)
      if (node) {
        const box = entry.contentRect
        const newSize = {
          width: trimNumber(node.width || (node.expanded ? box.width : Math.min(Math.max(box.width + DEFAULT_NODE_PADDING, 250), 500))),
          height: trimNumber(box.height)
        }
        if (newSize.width !== box.width && entry.target instanceof HTMLElement) {
          entry.target.style.width = `${newSize.width}px`
        }
        batchNewSize.push({ ...newSize, id: nodeId })
      }
    }
    if (batchNewSize.length) {
      setTimeout(() => {
        this.instance.updateWhiteboard?.(w => {
          batchNewSize.forEach(s => {
            const o = w.nodes?.get(s.id)
            if (o) {
              w.nodes?.set(s.id, { ...o, ...s })
            }
          })
        }, false)
      })
    }
  })

  public isMovingMultiSelectBox = false

  public selectedNodeIds = new Set<number>()

  public setNodes: ReturnType<typeof useSetWhiteboardNodes> | undefined

  public erasedNodeIds = new Set<number>()
  public erasedEdgeIds = new Set<number>()

  public updateState: (updater: (curr: IWhiteboard) => void, withUndo?: boolean) => void = updater => {}

  public onNodeFocus?: (n: IWhiteboardNode) => void

  /**
   * Transform pointer to whiteboard coordinates
   */
  public transformPointer = (e: PointerEvent) => {
    const bounding = this.containerEle?.getBoundingClientRect()
    if (bounding) {
      const result = transformXY(bounding, e.clientX, e.clientY, this.containerTransformScale)
      return result
    }
  }
  public transformXY = (x: number, y: number) => {
    const bounding = this.containerEle?.getBoundingClientRect()
    if (bounding) {
      const result = transformXY(bounding, x, y, this.containerTransformScale)
      return result
    }
  }
  public getLatestNodeSize = (nodeId: number): Box => {
    const node = this.ID_TO_NODE_ELEMENT_MAP.get(nodeId)
    const box = node?.getLatestSize() || {
      left: 0,
      top: 0,
      width: 0,
      height: 0
    }
    return box
  }

  public updateNodeSize = (nodeId: number, newSize: XYPosition & Size) => {
    const node = this.ID_TO_NODE_ELEMENT_MAP.get(nodeId)
    if (node) {
      node.updateSize(newSize)
    }
  }

  public cachedRequest: {
    updater: (draft: Draft<IWhiteboard>) => void
    withUndo?: boolean
  }[] = []
  public batchUpdateWhiteboard = async (currentState: IWhiteboard) => {
    console.log(this.cachedRequest)
    const withUndoRequests: typeof this.cachedRequest = [],
      commonRequests: typeof this.cachedRequest = []
    this.cachedRequest.forEach(r => {
      if (r.withUndo) {
        withUndoRequests.push(r)
      } else {
        commonRequests.push(r)
      }
    })

    let afterRequestState =
      commonRequests.length > 0
        ? produce(currentState, draft => {
            commonRequests.forEach(r => r.updater(draft))
          })
        : currentState
    if (withUndoRequests.length > 0) {
      const [s, patches, inversePatches] = produceWithPatches(afterRequestState, draft => {
        withUndoRequests.forEach(r => r.updater(draft))
      })
      console.log(patches, inversePatches, s)
      afterRequestState = s
      this.pushUpdates({
        patches,
        inversePatches
      })
    }
    await ObjectStore('whiteboard').updateOne(afterRequestState)
    this.cachedRequest = []
  }
}

export default FlowManager
