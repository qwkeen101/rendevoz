import { globalStore, ObjectStore } from '@/stores'
import { Position } from '@/types'
import produce, { Draft, Patch, produceWithPatches } from 'immer'
import { PanZoom } from 'panzoom'
import { IWhiteboard, IWhiteboardNode } from '~/typings/data'
import { Box, Point, Size, XYPosition } from '~/typings'
import { transformXY } from '@/core/whiteboard/utils'
import { useSetWhiteboardNodes } from '@/core/whiteboard/hooks'
import { debounce } from 'lodash'

type HistoryItem = {
  patches: Patch[]
  inversePatches: Patch[]
}

class FlowManager {
  public whiteboardId?: number
  private intervalId: ReturnType<typeof setInterval> | undefined

  public clearSelectBox?: VoidFunction
  constructor() {
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
  public ID_TO_EDGE_MAP = new Map<
    number,
    {
      element?: SVGPathElement | null
      drawPath: VoidFunction
    }
  >()

  public history = {
    redos: [] as HistoryItem[],
    undos: [] as HistoryItem[]
  }

  public NODE_TO_EDGE_MAP = new Map<number, Set<number>>()

  public containerEle?: HTMLElement

  public parentContainerEle?: HTMLElement

  public containerTransformScale = 1

  public isAddingEdge = false

  public isDraggingNode = false

  public selectable = false

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
          const hasWidth = node.width !== undefined && node.width > 0
          const newSize = {
            width: hasWidth ? node.width : Math.min(box.width, 450),
            height: hasWidth ? box.height : undefined
          }
          const style = (target as HTMLElement).style
          style.width = `${newSize.width}px`
          style.height = `${newSize.height}px`
          const newWhiteboard = produce(whiteboard, draft => {
            draft?.nodes?.set(nodeId, {
              ...node,
              width: newSize.width,
              height: newSize.height
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
