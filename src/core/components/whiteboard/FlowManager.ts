import { ObjectStore } from '@/api/stores'
import produce, { Draft, Patch, produceWithPatches } from 'immer'
import { PanZoom } from 'panzoom'
import { IWhiteboard, IWhiteboardInstance, IWhiteboardNode } from '~/typings/data'
import { Box, Point, Size, XYPosition } from '~/typings'
import { transformXY } from '@/core/components/whiteboard/utils'
import { useSetWhiteboardNodes } from '@/core/components/whiteboard/StateHooks'
import { debounce } from 'lodash'
import { trimNumber } from '@/utils'

type HistoryItem = {
  patches: Patch[]
  inversePatches: Patch[]
}

class FlowManager {
  public whiteboardId?: number
  private intervalId: ReturnType<typeof setInterval> | undefined
  public focused = false
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
    console.log(entries)
    const nodeSizeChange: { id: number; width?: number; height?: number }[] = []
    for (const entry of entries) {
      const target = entry.target
      const nodeId = Number(target.getAttribute('data-node-id'))
      const node = this.instance.getNode?.(nodeId)
      console.log(node, entry)
      if (node) {
        const box = {
          width: entry.borderBoxSize[0].inlineSize,
          height: entry.borderBoxSize[0].blockSize
        }
        const newSize = {
          width: trimNumber(box.width),
          height: trimNumber(box.height)
        }
        if (newSize.width === 0 && newSize.height === 0) return
        if (newSize.width !== node.width || newSize.height !== node.height) {
          this.instance.nodeOps?.updateRelatedEdges(nodeId)
          nodeSizeChange.push({ ...newSize, id: nodeId })
          if (!this.instance.nodeOps?.getNodeFuncs(nodeId)?.sizeAlreadyDefined()) {
            batchNewSize.push({ ...newSize, id: nodeId })
          }
        }
      }
    }
    const nodeFuncArr = Array.from(this.instance.values.ID_TO_NODE_MAP.values())
    if (nodeSizeChange.length) {
      const sizeChanged = nodeSizeChange.map(i => ({ ...this.instance.getNode?.(i.id), ...i }))
      this.instance.emit?.({
        type: 'nodeSizeChange',
        changed: sizeChanged
      })
      setTimeout(() => {
        this.instance.eventEmitter.emit('whiteboard', {
          type: 'nodesSizeChange',
          data: {
            changedNodes: sizeChanged
          }
        })
      })
      nodeFuncArr.forEach(i => {
        i.onSomeNodeSizeChange?.(sizeChanged)
      })
    }
    if (batchNewSize.length) {
      console.log(batchNewSize)
      setTimeout(() => {
        this.instance.updateWhiteboard?.(w => {
          batchNewSize.forEach(s => {
            const o = w.nodes?.get(s.id)
            if (o) {
              const newNode = { ...o, ...s }
              w.nodes?.set(s.id, newNode)
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

  public cachedRequest: {
    updater: (draft: Draft<IWhiteboard>) => void
    withUndo?: boolean
  }[] = []
  public batchUpdateWhiteboard = async (currentState: IWhiteboard) => {
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
      afterRequestState = s
      this.pushUpdates({
        patches,
        inversePatches
      })
    }
    this.cachedRequest = []
    await ObjectStore('whiteboard').updateOne(afterRequestState)
  }
}

export default FlowManager
