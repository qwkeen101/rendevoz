import { useMemoizedFn, useRafFn } from '@/hooks'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { DraggableData, Rnd } from 'react-rnd'
import { IWhiteboardNode, XYPosition } from '~/typings'
import { Box } from '~/typings'
import { assignProperties, calculateSelectionBox } from '@/utils'
import { useFlow } from '../StateHooks'
import { getBoxOfNodes, isPointerOnContainer } from '../utils'
import { useWhiteboardState } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import _ from 'lodash'
import resizeMultipleNodes from '@/core/components/whiteboard/utils/resizeMultipleNodes'
import useUpdateWhiteboard from '@/core/components/whiteboard/hooks/useUpdateWhiteboard'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import { css } from '@emotion/css'
import { AnimatePopover, Icon, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'

const cursorClass = css({
  '*': {
    cursor: 'default !important'
  }
})
const useWhiteboardSelect = (containerRef: MutableRefObject<HTMLElement | null>) => {
  const [multiSelectedBox, setMultiSelectedBox] = useState<Box>()

  const selectedOffsetRef = useRef(new Map())
  const selectBoxRef = useRef<HTMLDivElement>(null)
  const selectedNodeIdsRef = useRef(new Set<number>())
  const flow = useFlow()
  const multiSelectBoxRef = useRef<HTMLDivElement>()
  const idToBoxMapRef = useRef<idToBoxMap>(new Map())
  const latestUpdateResizeNodes = useRef<Partial<IWhiteboardNode[]>>([])
  const [whiteboardState, setWhiteboardState] = useWhiteboardState()
  const scale = whiteboardState.zoom
  const updateWhiteboard = useUpdateWhiteboard()
  const instance = useWhiteboardInstance()
  const selectStartPointRef = useRef<XYPosition>()
  const selectEndPointRef = useRef<XYPosition>()
  const [isDraggingSelectionBox, setIsDraggingSelectionBox] = useState(false)
  assignProperties(instance, {
    selectOps: {
      isSelecting: () => whiteboardState.isSelecting,
      hasSelectedNodes: () => {
        return selectedNodeIdsRef.current.size > 0
      },
      selectNode: (nodeId, setState = true) => {
        const idArr = Array.isArray(nodeId) ? nodeId : [nodeId]
        idArr.forEach(id => {
          if (setState) {
            instance.values.ID_TO_NODE_MAP.get(id)?.select()
          }
          selectedNodeIdsRef.current.add(id)
        })
      },
      deselectNode: nodeId => {
        const idArr = Array.isArray(nodeId) ? nodeId : [nodeId]
        idArr.forEach(id => {
          instance.values.ID_TO_NODE_MAP.get(id)?.deselect()
          selectedNodeIdsRef.current.delete(id)
        })
      },
      getSelectedNodes: () => {
        const ids = Array.from(selectedNodeIdsRef.current.values())
        console.log(ids)
        if (!instance.getNode) {
          throw new Error('Failed to initialize whiteboard!')
        }
        return ids.map(id => instance.getNode?.(id)).filter(i => i) as IWhiteboardNode[]
      },
      removeSelectionBox: () => {
        selectStartPointRef.current = undefined
        selectEndPointRef.current = undefined
        instance.values.selectBox = undefined
        setWhiteboardState(s => ({ ...s, isSelecting: false }))
      },
      resetSelectionBox: () => {
        if (multiSelectedBox) {
          const allSelectedNodes = instance.selectOps?.getSelectedNodes()
          if (allSelectedNodes) {
            setMultiSelectedBox(getBoxOfNodes(allSelectedNodes))
          } else {
            instance.selectOps?.deselectAll()
          }
        }
      },
      deselectAll: skip => {
        const skipIds = new Set(Array.isArray(skip) ? skip : [skip])
        setMultiSelectedBox(undefined)
        selectedNodeIdsRef.current.forEach(id => {
          if (!skipIds.has(id)) {
            instance.selectOps?.deselectNode(id)
            selectedNodeIdsRef.current.delete(id)
          }
        })
        instance.values.selectBox = undefined
        setWhiteboardState(s => ({ ...s, isSelecting: false }))
      }
    }
  })
  flow.clearSelectBox = () => {
    setMultiSelectedBox(undefined)
    selectedNodeIdsRef.current.clear()
    flow.selectedNodeIds.clear()
    setWhiteboardState(s => ({ ...s, isSelecting: false }))
  }
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    // if have pointer draw selection box
    if (multiSelectedBox) {
      if (e.type === 'pointerdown' && e.button === 0) {
        if (!multiSelectBoxRef.current?.contains(e.target as HTMLElement)) {
          instance.selectOps?.deselectAll()
        }
      }
    }
    if (
      !whiteboardState.isPanning &&
      !['erase', 'freehand'].includes(whiteboardState.currentTool) &&
      whiteboardState.pointerMode === 'select'
    ) {
      if (e.type === 'pointerdown' && e.button === 0) {
        // only allows pointer on container to select
        if (!isPointerOnContainer(e, instance)) return
        idToBoxMapRef.current.clear()
        // e.preventDefault()
        const transformedXY = instance.coordOps?.transformWindowPositionToPosition({ x: e.clientX, y: e.clientY })
        transformedXY && (selectStartPointRef.current = transformedXY)
        flow.parentContainerEle?.classList.add(cursorClass)
      }
      if (e.type === 'pointerup') {
        // pointer up, remove disable select class and open float toolbar
        flow.parentContainerEle?.classList.remove(cursorClass)
        // set timeout here to prevent clear selected nodes state when pointer up
        setTimeout(() => {
          // clear start and end point and box
          instance.selectOps?.removeSelectionBox()
        })
        if (whiteboardState.isSelecting) {
          const currentBox = instance.coordOps?.transformWindowPositionToPosition({ x: e.clientX, y: e.clientY })
          if (
            currentBox &&
            selectStartPointRef.current &&
            (Math.abs(currentBox.x - selectStartPointRef.current.x) > 3 || Math.abs(currentBox.y - selectStartPointRef.current.y) > 3)
          ) {
            // prevent default here to prevent select unnamed group
            e.preventDefault()
          }
        }
      }
      if (e.type === 'pointermove' && e.button === -1) {
        if (selectStartPointRef.current && !flow.isMovingMultiSelectBox && !instance.values.isResizingSelectionBox) {
          const currentBox = instance.coordOps?.transformWindowPositionToPosition({ x: e.clientX, y: e.clientY })
          if (
            currentBox &&
            selectStartPointRef.current &&
            (Math.abs(currentBox.x - selectStartPointRef.current.x) > 3 || Math.abs(currentBox.y - selectStartPointRef.current.y) > 3)
          ) {
            if (!whiteboardState.isSelecting) {
              setWhiteboardState(s => ({ ...s, isSelecting: true }))
            }
            drawSelectionBox(e)
            rafSelect()
          }
          e.preventDefault()
        }
      }
    }
  })

  const drawSelectionBox = useMemoizedFn((e: PointerEvent) => {
    const transformedXY = instance.coordOps?.transformWindowPositionToPosition({
      x: e.clientX,
      y: e.clientY
    })
    if (transformedXY) {
      selectEndPointRef.current = transformedXY
      const startPoint = selectStartPointRef.current
      if (startPoint) {
        const selectBox = calculateSelectionBox({
          startPoint: startPoint,
          endPoint: transformedXY
        })
        selectBoxRef.current?.style.setProperty('transform', `translate(${selectBox.left}px,${selectBox.top}px)`)
        selectBoxRef.current?.style.setProperty('width', `${selectBox.width}px`)
        selectBoxRef.current?.style.setProperty('height', `${selectBox.height}px`)
        instance.values.selectBox = selectBox
      }
    }
  })
  const rafSelect = useRafFn((skip?: boolean) => {
    const selectBox = instance.values.selectBox
    if (selectBox) {
      selectedNodeIdsRef.current.clear()
      const allNodes = instance.getAllNode?.()
      if (allNodes) {
        const selectedNodes = allNodes.filter(node => {
          const intersected = instance.nodeOps?.intersectWith(node.id, selectBox)
          if (!intersected) {
            instance.selectOps?.deselectNode(node.id)
          }
          return intersected
        })
        if (selectedNodes.length > 0) {
          const outerBox = getBoxOfNodes(selectedNodes)
          if (!outerBox) {
            throw new Error('Failed to select nodes!')
          }
          selectedNodeIdsRef.current = new Set(selectedNodes.map(i => i.id))
          const currentMultiSelectBox = multiSelectedBox
          if (!skip && !_.isEqual(currentMultiSelectBox, outerBox)) {
            setMultiSelectedBox(outerBox)
          }
          // store nodes offset to select box
          const offsetMap = selectedOffsetRef.current
          offsetMap.clear()
          selectedNodes.forEach(node => {
            offsetMap.set(node.id, {
              left: node.x - outerBox.left,
              top: node.y - outerBox.top
            })
            instance.selectOps?.selectNode(node.id)
          })
          return
        }
      }
      setMultiSelectedBox(undefined)
    }
  })

  useEffect(() => {
    const container = containerRef.current
    const parent = container?.parentElement
    if (parent) {
      parent.addEventListener('pointerdown', pointerHandler)
      document.addEventListener('pointermove', pointerHandler)
      document.addEventListener('pointerup', pointerHandler)
    }
    return () => {
      parent?.removeEventListener('pointerdown', pointerHandler)
      document.removeEventListener('pointermove', pointerHandler)
      document.removeEventListener('pointerup', pointerHandler)
    }
  }, [])

  const renderSelectBox = () => {
    if (whiteboardState.isSelecting) {
      return (
        <div
          ref={selectBoxRef}
          style={{
            position: 'absolute',
            userSelect: 'none',
            background: 'rgba(39, 158, 255, 0.2)',
            overflow: 'hidden',
            zIndex: 11,
            pointerEvents: 'none'
          }}
        ></div>
      )
    }
  }
  const updateMulti = (data: DraggableData) => {
    const map = selectedOffsetRef.current
    updateWhiteboard(w => {
      selectedNodeIdsRef.current.forEach(id => {
        const node = w.nodes?.get(id)
        const offset = map.get(id)
        const newNode: IWhiteboardNode = {
          ...node,
          x: data.x + offset.left,
          y: data.y + offset.top
        }
        idToBoxMapRef.current.set(id, {
          left: newNode.x,
          top: newNode.y,
          width: newNode.width!,
          height: newNode.height!
        })
        w.nodes?.set(id, newNode)
      })
    }, true)
  }

  // update selected nodes position and draw path when moving selection box
  const updateMultiStyle = (data: DraggableData) => {
    const selected = instance.selectOps?.getSelectedNodes()
    const map = selectedOffsetRef.current
    if (selected?.length) {
      selected.forEach(node => {
        const offset = map.get(node.id)
        if (!offset) return
        instance.values.ID_TO_NODE_MAP.get(node.id)?.setStyle({
          transform: `translate(${data.x + offset.left}px, ${data.y + offset.top}px)`
        })
        instance.values.NODE_TO_EDGE_MAP.get(node.id)?.forEach(edgeId => instance.values.ID_TO_EDGE_MAP.get(edgeId)?.drawPath())
      })
    }
  }
  const rafUpdateMultiStyle = useRafFn(updateMultiStyle)
  const rndRef = useRef<Rnd>()
  const [isResizing, setIsResizing] = useState(false)
  const renderMultiSelectBox = () => {
    if (multiSelectedBox) {
      const { left, top, width, height } = multiSelectedBox
      const windowPos = instance.coordOps?.transformWhiteboardPositionToWindowPosition({ x: left, y: top })
      console.log(windowPos)
      return (
        <>
          <Rnd
            ref={node => {
              if (node) {
                multiSelectBoxRef.current = node?.getSelfElement()
                rndRef.current = node
              }
            }}
            enableResizing={{
              topLeft: true,
              topRight: true,
              bottomLeft: true,
              bottomRight: true
            }}
            size={{ width, height }}
            position={{ x: left, y: top }}
            onResizeStart={() => {
              setIsResizing(true)
              instance.values.isResizingSelectionBox = true
            }}
            minWidth={isResizing ? 200 : undefined}
            onMouseDown={e => {
              if (selectedNodeIdsRef.current.size && multiSelectedBox && e.button === 2) {
                if (multiSelectedBox) {
                  const pos = instance.coordOps?.transformWindowPositionToPosition?.({
                    x: e.clientX,
                    y: e.clientY
                  })
                  if (pos) {
                    const toolbarState = instance.toolbarOps?.getToolbarState()
                    if (toolbarState?.visible && toolbarState.type === 'select') {
                      instance.toolbarOps?.closeToolbar()
                    } else {
                      instance.toolbarOps?.openSelectToolbar?.(pos)
                    }
                  }
                }
              }
            }}
            onResize={(e, dir, elementRef) => {
              const eleBox = elementRef.getBoundingClientRect()
              const trans = instance.coordOps?.transformWindowPositionToPosition
              if (!trans) return
              let pos = {
                x: 0,
                y: 0
              }
              if (dir === 'topLeft') {
                pos = trans({
                  x: eleBox.x,
                  y: eleBox.y
                })
              }
              if (dir === 'topRight') {
                pos = trans({
                  x: eleBox.right,
                  y: eleBox.y
                })
              }
              if (dir === 'bottomLeft') {
                pos = trans({ x: eleBox.x, y: eleBox.bottom })
              }
              if (dir === 'bottomRight') {
                pos = trans({ x: eleBox.right, y: eleBox.bottom })
              }
              const selectedNodes = Array.from(selectedNodeIdsRef.current.values()).map(id => instance.getNode?.(id)) as IWhiteboardNode[]
              const nodesToUpdate = resizeMultipleNodes(instance, selectedNodes, dir, false, pos)
              if (nodesToUpdate) {
                latestUpdateResizeNodes.current = nodesToUpdate
              }
            }}
            onResizeStop={(e, dir, elementRef) => {
              setIsResizing(false)
              setTimeout(() => {
                instance.values.isResizingSelectionBox = false
              })
              const bounding = elementRef.getBoundingClientRect()
              const transformed = instance.coordOps?.transformWindowPositionToPosition({ x: bounding.x, y: bounding.y })
              if (!transformed) return
              const newBox = {
                left: transformed.x,
                top: transformed.y,
                width: bounding.width / scale,
                height: bounding.height / scale
              }
              setMultiSelectedBox(newBox)
              if (latestUpdateResizeNodes.current.length) {
                updateWhiteboard(w => {
                  latestUpdateResizeNodes.current.forEach(n => {
                    // @ts-ignore
                    w.nodes?.set(n.id, {
                      ...w.nodes?.get(n.id),
                      ...n,
                      resized: true
                    })
                  })
                }, true).then(() => {
                  console.log('clear')
                  latestUpdateResizeNodes.current = []
                  rafSelect()
                })
              }
            }}
            lockAspectRatio={true}
            resizeHandleComponent={{
              topLeft: <SelectionGroupResizer />,
              topRight: <SelectionGroupResizer />,
              bottomLeft: <SelectionGroupResizer />,
              bottomRight: <SelectionGroupResizer />
            }}
            onMouseUp={e => {
              e.stopPropagation()
            }}
            onDragStart={() => {
              setIsDraggingSelectionBox(true)
            }}
            onDrag={(e, data) => {
              flow.isMovingMultiSelectBox = true
              rafUpdateMultiStyle(data)
            }}
            onDragStop={(e, data) => {
              if (flow.isMovingMultiSelectBox) {
                updateMulti(data)
                setMultiSelectedBox(b => ({
                  ...b,
                  left: data.x,
                  top: data.y
                }))
                setIsDraggingSelectionBox(false)
              }
              flow.isMovingMultiSelectBox = false
            }}
            resizeHandleStyles={{
              topLeft: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              },
              topRight: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              },
              bottomRight: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              },
              bottomLeft: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }
            }}
            style={{
              outline: 'calc(3px * var(--zoom-level)) solid var(--select-color)',
              zIndex: 11,
              borderRadius: 4,
              pointerEvents: 'auto'
            }}
            scale={scale}
          ></Rnd>
        </>
      )
    }
  }

  const renderSelect = () => {
    const windowPos =
      multiSelectedBox &&
      instance.coordOps?.transformWhiteboardPositionToWindowPosition({ x: multiSelectedBox.left, y: multiSelectedBox.top })
    return (
      <>
        {renderSelectBox()}
        {renderMultiSelectBox()}
        <AnimatePopover
          borderRadius={999}
          positions={['top', 'bottom']}
          visible={!!windowPos && !isDraggingSelectionBox && !whiteboardState.isSelecting}
          content={
            <WithBorder borderRadius={999}>
              <Icon
                onClick={event => {
                  if (multiSelectedBox) {
                    const pos = instance.coordOps?.transformWindowPositionToPosition?.({
                      x: event.clientX + 10,
                      y: event.clientY
                    })
                    if (pos) {
                      const toolbarState = instance.toolbarOps?.getToolbarState()
                      if (toolbarState?.visible && toolbarState.type === 'select') {
                        instance.toolbarOps?.closeToolbar()
                      } else {
                        instance.toolbarOps?.openSelectToolbar?.(pos)
                      }
                    }
                  }
                }}
                name={'park-more'}
                className={ClassName.circleButton(6)}
                size={20}
              />
            </WithBorder>
          }
          padding={10}
          position={{ left: windowPos?.x, top: windowPos?.y }}
        ></AnimatePopover>
      </>
    )
  }
  return {
    renderSelect
  }
}

const SelectionGroupResizer = () => {
  return (
    <div
      style={{
        borderRadius: '50%',
        width: `calc(12px * var(--zoom-level))`,
        height: `calc(12px * var(--zoom-level))`,
        background: 'white',
        border: `calc(3px * var(--zoom-level)) solid #279EFF`,
        pointerEvents: 'auto',
        position: 'absolute'
      }}
    ></div>
  )
}
export default useWhiteboardSelect
