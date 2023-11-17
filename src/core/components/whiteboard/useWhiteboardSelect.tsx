import { useMemoizedFn, useRafFn } from '@/hooks'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { DraggableData, Rnd } from 'react-rnd'
import { IWhiteboardNode } from '~/typings'
import { AnimatePopover, IconWithPopover, Toolbar, WithBorder } from '@/components'
import { Box } from '~/typings'
import { calculateSelectionBox } from '@/utils'
import { useFlow, useWhiteboardSelectState } from './hooks'
import { alignNodes, idToBoxMap } from './positionUtils'
import { isPointerOnContainer } from './utils'
import { useWhiteboardState } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import _ from 'lodash'
import resizeMultipleNodes from '@/core/components/whiteboard/utils/resizeMultipleNodes'
import useUpdateWhiteboard from '@/core/components/whiteboard/hooks/useUpdateWhiteboard'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import { css } from '@emotion/css'
import groupFreehands from '@/core/components/whiteboard/utils/groupFreehands'

const cursorClass = css({
  '*': {
    cursor: 'default !important'
  }
})
const useWhiteboardSelect = (containerRef: MutableRefObject<HTMLElement | null>) => {
  const [selectState, setSelectState] = useWhiteboardSelectState()
  const [multiSelectedBox, setMultiSelectedBox] = useState<Box>()

  const selectedOffsetRef = useRef(new Map())
  const selectBoxRef = useRef<HTMLDivElement>(null)
  const selectedNodeIdsRef = useRef(new Set<number>())
  const flow = useFlow()
  const multiSelectBoxRef = useRef<HTMLDivElement>()
  const idToBoxMapRef = useRef<idToBoxMap>(new Map())
  const latestUpdateResizeNodes = useRef<Partial<IWhiteboardNode[]>>([])
  const [whiteboardState, setWhiteboardState] = useWhiteboardState()
  const updateWhiteboard = useUpdateWhiteboard()
  flow.clearSelectBox = () => {
    setMultiSelectedBox(undefined)
    selectedNodeIdsRef.current.clear()
    flow.selectedNodeIds.clear()
    setSelectState({ isSelecting: false })
    setWhiteboardState(s => ({ ...s, isSelecting: false }))
  }
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (multiSelectedBox) {
      if (e.type === 'pointerdown' && e.button === 0) {
        if (!multiSelectBoxRef.current?.contains(e.target as HTMLElement)) {
          flow.hasMultiSelectBox = false
          setMultiSelectedBox(undefined)
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
        if (!isPointerOnContainer(e)) return
        idToBoxMapRef.current.clear()
        e.preventDefault()
        flow.isSelecting = true
        const transformedXY = flow.transformPointer(e)
        transformedXY &&
          (flow.selectStartPoint = {
            x: transformedXY.x,
            y: transformedXY.y
          })
        flow.parentContainerEle?.classList.add(cursorClass)
      }
      if (e.type === 'pointerup') {
        flow.isSelecting = false
        flow.parentContainerEle?.classList.remove(cursorClass)
        setWhiteboardState(s => ({ ...s, isSelecting: false }))
        flow.selectedNodeIds.forEach(id => {
          const node = flow.ID_TO_NODE_ELEMENT_MAP.get(id)?.getNode()
          if (node && node.width && node.height) {
            idToBoxMapRef.current.set(id, {
              width: node.width,
              height: node.height,
              left: node.x,
              top: node.y
            })
          }
        })
        setSelectState({
          isSelecting: false
        })
      }
      if (e.type === 'pointermove' && e.button === -1) {
        if (flow.isSelecting && !flow.isMovingMultiSelectBox) {
          if (!whiteboardState.isSelecting) {
            setWhiteboardState(s => ({ ...s, isSelecting: true }))
          }
          e.preventDefault()
          drawSelectionBox(e)
          rafSelect()
        }
      }
    }
  })
  const drawSelectionBox = useMemoizedFn((e: PointerEvent) => {
    const transformedXY = flow.transformPointer(e)
    if (transformedXY) {
      flow.selectEndPoint = {
        x: transformedXY.x,
        y: transformedXY.y
      }
      if (flow.selectStartPoint) {
        const selectBox = calculateSelectionBox({
          startPoint: flow.selectStartPoint,
          endPoint: flow.selectEndPoint
        })
        selectBoxRef.current?.style.setProperty('transform', `translate(${selectBox.left}px,${selectBox.top}px)`)
        selectBoxRef.current?.style.setProperty('width', `${selectBox.width}px`)
        selectBoxRef.current?.style.setProperty('height', `${selectBox.height}px`)
        flow.selectBox = selectBox
      }
    }
  })
  const rafSelect = useRafFn((skip?: boolean) => {
    if (flow.selectStartPoint) {
      selectedNodeIdsRef.current.clear()
      const selectedBoxes = Array.from(flow.ID_TO_NODE_ELEMENT_MAP.entries())
        .map(([k, v]) => [k, v.checkSelectIntersection()])
        .filter(i => i[1]) as [id: number, box: Box][]
      if (selectedBoxes.length > 0) {
        let minX = Number.MAX_VALUE,
          minY = Number.MAX_VALUE,
          maxX = -Number.MAX_VALUE,
          maxY = -Number.MAX_VALUE
        selectedBoxes.forEach(([id, box]) => {
          minX = Math.min(minX, box.left)
          minY = Math.min(minY, box.top)
          maxX = Math.max(maxX, box.left + box.width)
          maxY = Math.max(maxY, box.top + box.height)
          selectedNodeIdsRef.current.add(id)
        })
        const width = maxX - minX
        const height = maxY - minY
        const left = minX
        const top = minY
        const currentMultiSelectBox = multiSelectedBox
        if (
          !skip &&
          !_.isEqual(currentMultiSelectBox, {
            left,
            top,
            width,
            height
          })
        ) {
          setMultiSelectedBox({
            left,
            top,
            width,
            height
          })
        }

        flow.hasMultiSelectBox = true
        const offsetMap = selectedOffsetRef.current
        offsetMap.clear()
        selectedBoxes.forEach(([id, box]) => {
          offsetMap.set(id, {
            left: box.left - left,
            top: box.top - top
          })
        })
      } else {
        flow.hasMultiSelectBox = false
        setMultiSelectedBox(undefined)
      }
    }
  })
  const instance = useWhiteboardInstance()
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
            // boxShadow: '0 0 0 calc(2px * var(--zoom-level)) #279EFF',
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
      flow.selectedNodeIds.forEach(id => {
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
  const updateMultiStyle = (data: DraggableData) => {
    const map = selectedOffsetRef.current
    flow.selectedNodeIds.forEach(id => {
      const nodeEle = flow.ID_TO_NODE_ELEMENT_MAP.get(id)?.element
      if (nodeEle) {
        const offset = map.get(id)
        nodeEle.style.setProperty('transform', `translate(${data.x + offset.left}px, ${data.y + offset.top}px)`)
        flow.NODE_TO_EDGE_MAP.get(id)?.forEach(l => flow.ID_TO_EDGE_MAP.get(l)?.drawPath())
      }
    })
  }
  const rafUpdateMultiStyle = useRafFn(updateMultiStyle)

  const handleAlignNodes = (alignment: Parameters<typeof alignNodes>[0]) => {
    const idToBoxMap = alignNodes(alignment, idToBoxMapRef.current)
    updateWhiteboard(w => {
      idToBoxMap.forEach((box, id) => {
        const origin = w.nodes?.get(id)
        if (origin) {
          w.nodes?.set(id, {
            ...origin,
            width: box.width,
            height: box.height,
            x: box.left,
            y: box.top
          })
        }
      })
    }, true)
  }
  const renderMultiSelectBox = () => {
    if (multiSelectedBox) {
      const { left, top, width, height } = multiSelectedBox
      return (
        <>
          <AnimatePopover
            positions={['top', 'bottom']}
            padding={10}
            content={
              <WithBorder padding="0px 6px" onPointerUp={e => e.stopPropagation()}>
                <Toolbar style={{ gap: 2 }}>
                  <Toolbar.Item
                    tooltip="Delete"
                    iconName="park-delete"
                    onClick={() => {
                      if (selectedNodeIdsRef.current) {
                        instance.deleteNodes?.(Array.from(selectedNodeIdsRef.current.values()))
                      }
                      setMultiSelectedBox(undefined)
                    }}
                  />
                  <Toolbar.Item
                    tooltip="Group"
                    iconName="park-group"
                    onClick={() => {
                      setMultiSelectedBox(undefined)
                      flow.hasMultiSelectBox = false
                      updateWhiteboard(w => {
                        const groupNodeId = Id.getId()
                        w.nodes?.set(groupNodeId, {
                          id: groupNodeId,
                          type: 'group',
                          x: left - 10,
                          y: top - 10,
                          width: width + 20,
                          height: height + 20,
                          name: 'Unnamed Group'
                        })
                      }, true)
                    }}
                  />
                  <Toolbar.Item tooltip="Align">
                    <IconWithPopover
                      name="park-left-alignment"
                      size={18}
                      content={
                        <WithBorder style={{ padding: '4px', width: 200 }}>
                          <div onClick={() => handleAlignNodes('left')} className={ClassName.flatButton()}>
                            Align Left
                          </div>
                          <div onClick={() => handleAlignNodes('right')} className={ClassName.flatButton()}>
                            Align Right
                          </div>
                          <div onClick={() => handleAlignNodes('top')} className={ClassName.flatButton()}>
                            Align Top
                          </div>
                          <div onClick={() => handleAlignNodes('bottom')} className={ClassName.flatButton()}>
                            Align Bottom
                          </div>
                        </WithBorder>
                      }
                    ></IconWithPopover>
                  </Toolbar.Item>
                </Toolbar>
              </WithBorder>
            }
            visible={multiSelectedBox && !selectState.isSelecting}
          >
            <div
              style={{
                position: 'absolute',
                left,
                top,
                width,
                height
              }}
            ></div>
          </AnimatePopover>
          <Rnd
            ref={node => {
              multiSelectBoxRef.current = node?.getSelfElement()
            }}
            enableResizing={{
              topLeft: true,
              topRight: true,
              bottomLeft: true,
              bottomRight: true
            }}
            size={{ width, height }}
            position={{ x: left, y: top }}
            onResize={(e, dir, elementRef) => {
              const elementBounding = elementRef.getBoundingClientRect()
              let pos = {
                x: 0,
                y: 0
              }
              if (dir === 'topLeft') {
                pos = flow.transformXY(elementBounding.x, elementBounding.y)
              }
              if (dir === 'topRight') {
                pos = flow.transformXY(elementBounding.right, elementBounding.y)
              }
              if (dir === 'bottomLeft') {
                pos = flow.transformXY(elementBounding.x, elementBounding.bottom)
              }
              if (dir === 'bottomRight') {
                pos = flow.transformXY(elementBounding.right, elementBounding.bottom)
              }
              flow.selectStartPoint = pos
              const selectedNodes = Array.from(selectedNodeIdsRef.current.values()).map(id =>
                flow.ID_TO_NODE_ELEMENT_MAP.get(id)!.getNode()
              )
              const nodesToUpdate = resizeMultipleNodes(flow, selectedNodes, dir, false, pos)
              if (nodesToUpdate) {
                latestUpdateResizeNodes.current = nodesToUpdate
              }
            }}
            onResizeStop={(e, dir, elementRef) => {
              const bounding = elementRef.getBoundingClientRect()
              const transformed = flow.transformXY(bounding.x, bounding.y)!
              const newBox = {
                left: transformed.x,
                top: transformed.y,
                width: bounding.width / flow.containerTransformScale,
                height: bounding.height / flow.containerTransformScale
              }
              flow.selectBox = newBox
              setMultiSelectedBox(newBox)
              if (latestUpdateResizeNodes.current.length) {
                updateWhiteboard(w => {
                  latestUpdateResizeNodes.current.forEach(n => {
                    w.nodes?.set(n.id, {
                      ...w.nodes?.get(n.id),
                      ...n
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
              idToBoxMapRef.current.clear()
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
              outline: 'calc(3px * var(--zoom-level)) solid #279EFF',
              zIndex: 11,
              borderRadius: 4,
              pointerEvents: 'auto'
            }}
            scale={flow.containerTransformScale}
          ></Rnd>
        </>
      )
    }
  }

  const renderSelect = () => (
    <>
      {renderSelectBox()}
      {renderMultiSelectBox()}
    </>
  )
  return {
    renderSelect
  }
}

const SelectionGroupResizer = () => {
  return (
    <div
      style={{
        borderRadius: '50%',
        width: `calc(16px * var(--zoom-level))`,
        height: `calc(16px * var(--zoom-level))`,
        background: 'white',
        border: `calc(3px * var(--zoom-level)) solid #279EFF`,
        pointerEvents: 'auto',
        position: 'absolute'
      }}
    ></div>
  )
}
export default useWhiteboardSelect
