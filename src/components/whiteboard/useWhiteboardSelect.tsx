import { useMemoizedFn, useRafFn } from '@/hooks'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import produce from 'immer'
import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { DraggableData, Rnd } from 'react-rnd'
import { IWhiteboardNode } from '~/typings/data/whiteboard'
import { AnimatePopover, Icon, IconWithPopover, Tooltip, WithBorder } from '..'
import { Box } from '../dragSelector'
import { calculateSelectionBox } from '../dragSelector/utils/boxes'
import { useFlow, useSetWhiteboardNodes, useWhiteboardSelectState } from './hooks'
import { alignNodes, idToBoxMap } from './positionUtils'
import { isPointerOnContainer, transformXY } from './utils'

const useWhiteboardSelect = (containerRef: MutableRefObject<HTMLElement | null>) => {
  const [selectState, setSelectState] = useWhiteboardSelectState()
  const [multiSelectedBox, setMultiSelectedBox] = useState<Box>()

  const selectedOffsetRef = useRef(new Map())
  const selectBoxRef = useRef<HTMLDivElement>(null)
  const selectedNodeIdsRef = useRef(new Set<number>())
  const flow = useFlow()
  const setNodes = useSetWhiteboardNodes()
  const multiSelectBoxRef = useRef<HTMLDivElement>()
  const idToBoxMapRef = useRef<idToBoxMap>(new Map())
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (multiSelectedBox) {
      if (e.type === 'pointerdown' && !multiSelectBoxRef.current?.contains(e.target as HTMLElement)) {
        flow.hasMultiSelectBox = false
        setMultiSelectedBox(undefined)
      }
    }
    if (flow.selectable) {
      if (e.type === 'pointerdown') {
        // only allows pointer on container to select
        if (!isPointerOnContainer(e)) return
        idToBoxMapRef.current.clear()
        flow.isSelecting = true
        const transformedXY = transformXY(containerRef.current.getBoundingClientRect(), e.clientX, e.clientY, flow.containerTransformScale)
        transformedXY &&
          (flow.selectStartPoint = {
            x: transformedXY.x,
            y: transformedXY.y
          })
      }
      if (e.type === 'pointerup') {
        flow.isSelecting = false
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
      if (e.type === 'pointermove') {
        if (flow.isSelecting && !flow.isMovingMultiSelectBox) {
          e.preventDefault()
          rafSelect(e)
        }
      }
    }
  })
  const rafSelect = useRafFn((e: PointerEvent) => {
    const containerBound = containerRef.current?.getBoundingClientRect()
    if (!containerBound) return
    selectedNodeIdsRef.current.clear()
    const transformedXY = transformXY(containerBound, e.clientX, e.clientY, flow.containerTransformScale)
    if (transformedXY) {
      flow.selectEndPoint = {
        x: transformedXY.x,
        y: transformedXY.y
      }
      if (flow.selectStartPoint) {
        setSelectState({
          isSelecting: true
        })
        const selectBox = calculateSelectionBox({ startPoint: flow.selectStartPoint, endPoint: flow.selectEndPoint })
        selectBoxRef.current?.style.setProperty('transform', `translate(${selectBox.left}px,${selectBox.top}px)`)
        selectBoxRef.current?.style.setProperty('width', `${selectBox.width}px`)
        selectBoxRef.current?.style.setProperty('height', `${selectBox.height}px`)
        flow.selectBox = selectBox
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
          const width = maxX - minX + 20
          const height = maxY - minY + 20
          const left = minX - 10
          const top = minY - 10
          setMultiSelectedBox({
            left,
            top,
            width,
            height
          })
          flow.hasMultiSelectBox = true
          const offsetMap = selectedOffsetRef.current
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
    if (selectState.isSelecting) {
      return (
        <div
          ref={selectBoxRef}
          style={{
            position: 'absolute',
            userSelect: 'none',
            background: 'rgba(0,0,0,0.1)',
            // border: '2px solid #8590ae',
            boxShadow: 'inset 0px 0px 0px 2px #8590ae',
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
    setNodes(nodes =>
      produce(nodes, draft => {
        flow.selectedNodeIds.forEach(id => {
          const node = nodes.get(id)
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
          draft.set(id, newNode)
        })
      })
    )
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
    setNodes(nodes =>
      produce(nodes, draft => {
        idToBoxMap.forEach((box, id) => {
          const origin = nodes.get(id)!
          draft.set(id, {
            ...origin,
            width: box.width,
            height: box.height,
            x: box.left,
            y: box.top
          })
        })
      })
    )
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
              <WithBorder style={{ display: 'flex', gap: 4, padding: 4 }} onPointerUp={e => e.stopPropagation()}>
                <Tooltip content="Delete">
                  <Icon
                    className={ClassName.circleButton(undefined, 4)}
                    onClick={() => {
                      setNodes(nodes =>
                        produce(nodes, draft => {
                          selectedNodeIdsRef.current.forEach(id => {
                            draft.delete(id)
                          })
                        })
                      )
                      setMultiSelectedBox(undefined)
                    }}
                    name="park-delete"
                  />
                </Tooltip>
                <Tooltip content="Group">
                  <Icon
                    className={ClassName.circleButton(undefined, 4)}
                    onClick={() => {
                      setMultiSelectedBox(undefined)
                      setNodes(nodes =>
                        produce(nodes, draft => {
                          const groupNodeId = Id.getId()
                          draft.set(groupNodeId, {
                            id: groupNodeId,
                            type: 'group',
                            x: left,
                            y: top,
                            width,
                            height,
                            name: 'Unnamed Group'
                          })
                        })
                      )
                    }}
                    name="park-group"
                  />
                </Tooltip>
                <Tooltip content="Align">
                  <IconWithPopover
                    name="park-left-alignment"
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
                        <div
                          className={ClassName.flatButton()}
                          onClick={() => {
                            setNodes(nodes =>
                              produce(nodes, draft => {
                                idToBoxMapRef.current.forEach((box, id) => {
                                  const origin = nodes.get(id)!
                                  draft.set(id, {
                                    ...origin,
                                    width: box.width,
                                    height: box.height,
                                    x: box.left,
                                    y: box.top
                                  })
                                })
                              })
                            )
                          }}
                        >
                          Cancel Align
                        </div>
                      </WithBorder>
                    }
                  ></IconWithPopover>
                </Tooltip>
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
            enableResizing={false}
            size={{ width, height }}
            position={{ x: left, y: top }}
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
            style={{
              background: 'rgba(0,0,0,0.1)',
              outline: '1px solid #8590ae',
              zIndex: 11,
              borderRadius: 8
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

export default useWhiteboardSelect
