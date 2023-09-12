import { CSSProperties, Dispatch, memo, ReactNode, SetStateAction, useEffect, useRef, useState } from 'react'
import { useFlow } from '../hooks'
import { IWhiteboardNode } from '~/typings'
import { useMemoizedFn, useRafFn, useSelectAtomValue, useSelectGlobalAtomValue } from '@/hooks'
import { AnimatePopover, Content, Icon, IconWithPopover, Tooltip, WithBorder } from '@/components'
import ClassName from '@/styles/classNames'
import { Rnd } from 'react-rnd'
import Zindexes from '@/consts/zindex'
import { getNodeData } from '../utils'
import { NodeResizer } from './NodeResizer'
import { boxesIntersect, pointInBox } from '@/utils'
import { Box } from '~/typings'
import MetaObjectNode from './MetaObjectNode'
import ImageNode from './ImageNode'
import VideoNode from './VideoNode'
import WebpageNode from './WebpageNode'
import BlockColorPicker from '@/core/editor/components/BlockColorPicker'
import { defaultBgColor } from '@/components/picker/colorPicker'
import NoteNode from './NoteNode'
import PdfNode from './PdfNode'
import { useUpdate } from 'react-use'
import useGroupDrag from './hooks/useGroupDrag'
import { nodeClassName, nodeNameClassName } from './nodeClasses'
import TextNode from '@/core/whiteboard/node/TextNode'
import { useScopedEventEmitter } from '@/events'
import { SettingAtom } from '@/core'
import useAddingEdgeInsideNode from '@/core/whiteboard/hooks/useAddingEdgeInsideNode'
import ChangeNameInput from '@/core/whiteboard/node/NodenameInput'
import { NodeEventHandler } from '@/core/whiteboard/node/types'
import FreehandNode from '@/core/whiteboard/node/FreehandNode'
import useNodeColor from '@/core/whiteboard/node/hooks/useNodeColor'
import getNodeStyle from '@/core/whiteboard/node/getNodeStyle'
import useEraseNode from '@/core/whiteboard/node/hooks/useEraseNode'
import useNodeSize from '@/core/whiteboard/node/hooks/useNodeSize'
import useUpdateWhiteboard from '@/core/whiteboard/hooks/useUpdateWhiteboard'
import { useWhiteboardInstance } from '@/core/whiteboard/hooks/useWhiteboardInstance'
import { WhiteboardStateAtom } from '@/core/whiteboard/hooks/useWhiteboardState'

export type NodeInnerState = Partial<{
  popoverVisible: boolean
  expanded: boolean
  selected: boolean
  focused: boolean
  isEditingName: boolean
  locked: boolean
  keepRatioResize: boolean
  isDragging: boolean
}>
export interface InnerNodeProps {
  node: Partial<IWhiteboardNode>
  setPopoverElements?: Dispatch<SetStateAction<(() => ReactNode)[]>>
  setNodeState?: Dispatch<SetStateAction<NodeInnerState>>
  onNameChange?: (name: string) => void
  nodeState?: NodeInnerState
}

const lockResizeElements = ['image', 'video']

const WrapperNode = ({ node }: { node: IWhiteboardNode }) => {
  const { x, y, type, name, id, background, width, height } = node
  const containerRef = useRef<HTMLDivElement>()
  const eventHandlerRef = useRef<NodeEventHandler>()
  const flow = useFlow()
  const updateWhiteboard = useUpdateWhiteboard()
  const isDraggingRef = useRef(false)
  const isResizingRef = useRef(false)
  const [nodeState, setNodeState] = useState<NodeInnerState>({
    popoverVisible: false,
    expanded: false,
    selected: false,
    focused: false,
    locked: false,
    isEditingName: false,
    keepRatioResize: false
  })
  const getNodeState = useMemoizedFn(() => {
    return nodeState
  })
  const panPointerMode = useSelectAtomValue(WhiteboardStateAtom, s => s.pointerMode) === 'pan'
  const instance = useWhiteboardInstance()
  const eventHandler = eventHandlerRef.current
  const shouldKeepRatio = useSelectGlobalAtomValue(SettingAtom, s => s.whiteboard.imageResizeKeepRatio)
  const [visiblePopoverElements, setVisiblePopoverElements] = useState<((() => ReactNode) | undefined)[]>([
    () => (
      <Tooltip position="top" content="Remove">
        <Icon
          size={18}
          className={ClassName.circleButton(undefined, 4)}
          name="park-delete"
          onClick={() => instance.deleteNode?.(node.id)}
        />
      </Tooltip>
    ),
    () => (
      <Tooltip position="top" content="Change Color">
        <IconWithPopover
          size={18}
          className={ClassName.circleButton(undefined, 4)}
          name="park-background-color"
          content={
            <BlockColorPicker
              onPickBackgroundColor={color => {
                updateWhiteboard(w => {
                  const origin = w.nodes?.get(node.id)
                  if (origin) {
                    w.nodes?.set(node.id, {
                      ...origin,
                      background: color === defaultBgColor ? undefined : color
                    })
                  }
                }, true)
              }}
              showBg
              showFont={false}
              showMoreBg={false}
            />
          }
        />
      </Tooltip>
    ),
    () => (
      <Tooltip position="top" content={getNodeState().locked ? 'Unlock Node' : 'Lock Node'}>
        <Icon
          name={getNodeState().locked ? 'park-unlock' : 'park-lock'}
          size={18}
          className={ClassName.circleButton(undefined, 4)}
          onClick={() => {
            setNodeState(s => ({
              ...s,
              locked: !s.locked
            }))
          }}
        />
      </Tooltip>
    ),
    type === 'group'
      ? () => (
          <Tooltip position="top" content="Change Name">
            <Icon
              name="park-text"
              size={18}
              className={ClassName.circleButton(undefined, 4)}
              onClick={() => {
                setNodeState(s => ({
                  ...s,
                  isEditingName: !s.isEditingName,
                  popoverVisible: false
                }))
              }}
            />
          </Tooltip>
        )
      : undefined
  ])

  const renderPopoverElements = () => {
    return visiblePopoverElements.map(i => i?.())
  }

  const { handleGroupMove, handleGroupMoveEnd, handleGroupMoveStart } = type === 'group' ? useGroupDrag(node) : {}

  const handleSelectIntersection = () => {
    const nodeData = getNodeData(id, flow)
    if (nodeData?.transformedXY && flow.selectBox && flow.selectStartPoint) {
      const { transformedXY, bound } = nodeData
      const thisBox: Box = {
        width: bound.width / flow.containerTransformScale,
        height: bound.height / flow.containerTransformScale,
        left: transformedXY.x,
        top: transformedXY?.y
      }
      const intersected = type === 'group' && pointInBox(flow.selectStartPoint, thisBox) ? false : boxesIntersect(thisBox, flow.selectBox)
      if (intersected) {
        setNodeState(s => ({
          ...s,
          selected: true
        }))
        flow.selectedNodeIds.add(id)
        return thisBox
      } else {
        flow.selectedNodeIds.delete(id)
        setNodeState(s => ({
          ...s,
          selected: false
        }))
      }
    }
  }

  const handleNameChange = useMemoizedFn((name: string) => {
    updateWhiteboard(
      w => {
        const origin = w.nodes?.get(id)
        if (origin) {
          w.nodes?.set(origin.id, {
            ...origin,
            name
          })
        }
      },
      node.type === 'group' ? true : false
    )
  })
  const handleBoxIntersected = (box: Box): boolean => {
    if (width && height) {
      return boxesIntersect(box, { left: x, top: y, width, height })
    }
    return false
  }
  if (containerRef.current) {
    flow?.ID_TO_NODE_ELEMENT_MAP.set(id, {
      element: containerRef.current,
      checkSelectIntersection: handleSelectIntersection,
      sizeAlreadyDefined: () => width !== undefined && height !== undefined,
      boxIntersect: handleBoxIntersected,
      getNode: () => node,
      updateSize: size => {
        if (containerRef.current) {
          const container = containerRef.current!
          container.style.width = `${size.width}px`
          container.style.height = `${size.height}px`
          container.style.transform = `translate(${size.x}px,${size.y}px)`
          rafUpdateEdge()
          eventHandler?.({
            type: 'resize',
            direction: 'both',
            newBox: {
              left: size.x,
              top: size.y,
              width: size.width,
              height: size.height
            }
          })
        }
      },
      getLatestSize: () => {
        const container = containerRef.current?.getBoundingClientRect()
        if (container) {
          const transformed = flow.transformXY(container.left, container.top)
          if (transformed) {
            return {
              width: container.width / flow.containerTransformScale,
              height: container.height / flow.containerTransformScale,
              left: transformed?.x,
              top: transformed.y
            }
          }
        }
        return {
          width: 0,
          height: 0,
          left: 0,
          top: 0
        }
      }
    })
  }
  useEffect(() => {
    setTimeout(() => rafUpdateEdge())
  }, [nodeState.expanded])

  const rafUpdateEdge = useRafFn(() => {
    flow.NODE_TO_EDGE_MAP.get(id)?.forEach(i => {
      flow.ID_TO_EDGE_MAP.get(i)?.drawPath()
    })
  })
  // remove selected state on click outside
  useEffect(() => {
    if (nodeState.selected || nodeState.focused) {
      const pointerDownHandler = (e: MouseEvent) => {
        console.log('click')
        if (flow.hasMultiSelectBox) return
        if (!containerRef.current?.contains(e.target as HTMLElement) && isResizingRef.current === false) {
          if (e.target instanceof HTMLElement && e.target.getAttribute('data-cover-id') === `${node.id}`) return
          setNodeState(s => ({ ...s, selected: false, focused: false }))
        }
      }
      document.addEventListener('click', pointerDownHandler)
      return () => {
        document.removeEventListener('click', pointerDownHandler)
      }
    }
  }, [nodeState.selected, nodeState.focused])

  const forceRender = useUpdate()

  const renderInnerNode = () => {
    switch (type) {
      case 'metaObject':
        return (
          <MetaObjectNode
            onNameChange={handleNameChange}
            setNodeState={setNodeState}
            node={node}
            setPopoverElements={setVisiblePopoverElements}
          />
        )
      case 'image':
        return <ImageNode node={node} />
      case 'video':
        return <VideoNode node={node} />
      case 'freehand':
        return (
          <FreehandNode
            node={node}
            onClick={handleClick}
            onEventHandlerRegistered={handler => {
              eventHandlerRef.current = handler
            }}
          />
        )

      case 'webpage':
        return <WebpageNode node={node} />
      case 'note':
        return <NoteNode onNameChange={handleNameChange} node={node} />
      case 'pdf':
        return <PdfNode onNameChange={handleNameChange} node={node} />
      case 'text':
        return <TextNode node={node} onClick={handleClick} setPopoverElements={setVisiblePopoverElements} />
    }
  }

  let containerOverflow: CSSProperties = {
    overflowX: 'hidden',
    overflowY: 'overlay'
  }
  if (node.type === 'freehand') {
    containerOverflow = {}
  }

  useNodeSize(containerRef.current)
  useEffect(() => {
    if (nodeState.selected) {
      flow.selectedNodeIds.add(node.id)
    } else {
      if (flow.hasMultiSelectBox) {
        return
      }
      flow.selectedNodeIds.delete(node.id)
    }
  }, [nodeState.selected])
  const { shouldDisplayCover, groupEnablePointer } = useAddingEdgeInsideNode(node, containerRef.current)
  const { stringColor, darkenBackground, stringDefaultColor, lightenDefaultColor, opacityBackground, darkenSecondBackground } =
    useNodeColor(background)

  const rndRef = useRef<Rnd>()
  const { handlePointerEvent, isTouched, isErasing } = useEraseNode(node.id)
  const scopedEmitter = useScopedEventEmitter()
  const [mouseIn, toggleMouseIn] = useState(false)
  useEffect(() => {
    const pointerHandler = (e: PointerEvent) => {
      handlePointerEvent(e)
      if (e.type === 'pointerenter') {
        toggleMouseIn(true)
      } else if (e.type === 'pointerleave') {
        toggleMouseIn(false)
      } else if (e.type === 'pointerup') {
        if (e.pointerType === 'touch') {
          handleClick()
        }
      }
    }
    const container = containerRef.current
    if (container) {
      container.addEventListener('pointerup', pointerHandler)
      container.addEventListener('pointerenter', pointerHandler)
      container.addEventListener('pointerleave', pointerHandler)
      return () => {
        container.removeEventListener('pointerup', pointerHandler)
        container.removeEventListener('pointerenter', pointerHandler)
        container.removeEventListener('pointerleave', pointerHandler)
      }
    }
  })
  const handleClick = () => {
    if (isDraggingRef.current || panPointerMode) return
    setNodeState(s => ({
      ...s,
      popoverVisible: true,
      selected: true,
      focused: true
    }))
  }
  const nodeStyle = getNodeStyle(node, nodeState, {
    displayCover: shouldDisplayCover,
    groupEnablePointer: groupEnablePointer,
    isErased: isTouched,
    isErasing,
    panPointerMode,
    background: {
      opacityBackground,
      darkenSecondBackground
    }
  })

  let showCover = true

  if (nodeState.focused || nodeState.locked) {
    showCover = false
  }
  if (node.type === 'freehand' && !node.background) {
    showCover = false
  }

  return (
    <Rnd
      ref={node => {
        rndRef.current = node
        containerRef.current = node?.getSelfElement()
      }}
      data-node-id={id}
      position={{ x, y }}
      enableResizing={mouseIn ? true : false}
      style={{
        ...nodeStyle,
        '--node-color': background ? stringColor : lightenDefaultColor,
        '--darken-node-color': background ? darkenBackground : stringDefaultColor
      }}
      minWidth={160}
      // maxWidth={nodeState.expanded ? undefined : 250}
      lockAspectRatio={(lockResizeElements.includes(type) || nodeState.keepRatioResize) && shouldKeepRatio}
      disableDragging={nodeState.focused || nodeState.locked || panPointerMode}
      resizeHandleComponent={{
        left: <NodeResizer nodeId={id} position="left" />,
        top: <NodeResizer nodeId={id} position="top" />,
        right: <NodeResizer nodeId={id} position="right" />,
        bottom: <NodeResizer nodeId={id} position="bottom" />
      }}
      className={nodeClassName}
      onResizeStart={() => {
        forceRender()
        scopedEmitter.emit('whiteboard', {
          type: 'nodeResizeStart',
          data: {
            resizingNode: node
          }
        })
      }}
      onResize={(e, dir, ele, delta, position) => {
        const bound = ele.getBoundingClientRect()
        const nodeData = getNodeData(node.id, flow)
        const direction = ['top', 'bottom'].includes(dir) ? 'y' : ['left', 'right'].includes(dir) ? 'x' : 'both'
        isResizingRef.current = true
        eventHandler?.({
          type: 'resize',
          direction,
          newBox: {
            left: nodeData.transformedXY?.x,
            top: nodeData.transformedXY?.y,
            width: bound.width / flow?.containerTransformScale,
            height: bound.height / flow?.containerTransformScale
          }
        })
        rafUpdateEdge()
        if (node.type !== 'group') {
          if (!node.width || !node.height) return
          let mouseX = node.x
          let mouseY = node.y

          if (dir.includes('top')) {
            mouseY -= delta.height
          }
          if (dir.toLowerCase().includes('left')) {
            mouseX -= delta.width
          }
          scopedEmitter.emit('whiteboard', {
            type: 'nodeResize',
            data: {
              resizingNode: {
                ...node,
                width: bound.width / flow?.containerTransformScale,
                height: bound.height / flow?.containerTransformScale,
                x: nodeData.transformedXY.x,
                y: nodeData.transformedXY.y,
                mouseY,
                mouseX,
                deltaHeight: delta.height,
                deltaWidth: delta.width,
                mouseWidth: node.width + delta.width,
                mouseHeight: node.height + delta.height
              },
              nodeElement: ele,
              rnd: rndRef.current
            }
          })
        }
      }}
      resizeHandleWrapperStyle={{ pointerEvents: 'inherit' }}
      onResizeStop={(e, dir, ele, delta, pos) => {
        const bound = ele.getBoundingClientRect()

        scopedEmitter.emit('whiteboard', {
          type: 'nodeResizeEnd'
        })
        setTimeout(() => {
          isResizingRef.current = false
        })
        updateWhiteboard(w => {
          const origin = w.nodes?.get(id)
          if (origin) {
            w.nodes?.set(id, {
              ...origin,
              x: pos.x,
              y: pos.y,
              height: bound.height / flow?.containerTransformScale,
              width: bound.width / flow?.containerTransformScale
            })
          }
        }, true)
      }}
      onDragStart={e => {
        scopedEmitter.emit('whiteboard', {
          type: 'nodeDragStart',
          data: {
            draggingNode: node
          }
        })
        forceRender()
        flow.isDraggingNode = true
        if (type === 'group') {
          handleGroupMoveStart()
        }
      }}
      onDrag={(e, data) => {
        if (Math.abs(data.deltaX) > 2 || Math.abs(data.deltaY) > 2) {
          isDraggingRef.current = true
        }
        if (type === 'group') {
          handleGroupMove(data, containerRef.current)
          rafUpdateEdge()
          // intentionally throw error to stop rnd set draggable state to sync drag state with inner group nodes
          throw ''
        } else {
          rafUpdateEdge()
          if (isDraggingRef.current) {
            scopedEmitter.emit('whiteboard', {
              type: 'nodeDrag',
              data: {
                draggingNode: {
                  ...node,
                  x: data.x,
                  y: data.y
                },
                nodeElement: data.node
              }
            })
          }
        }
      }}
      onDragStop={(e, data) => {
        scopedEmitter.emit('whiteboard', {
          type: 'nodeDragEnd'
        })
        flow.isDraggingNode = false
        setTimeout(() => {
          isDraggingRef.current = false
        })
        if (Math.abs(data.x - x) < 1 && Math.abs(data.y - y) < 1) return
        if (type === 'group') {
          handleGroupMoveEnd(data)
        } else {
          const nodeData = getNodeData(node.id, flow)
          if (!nodeData?.transformedXY) return
          updateWhiteboard(w => {
            const origin = w.nodes?.get(id)
            if (origin) {
              w.nodes?.set(id, {
                ...origin,
                x: Number(nodeData.transformedXY!.x.toFixed(2)),
                y: Number(nodeData.transformedXY!.y.toFixed(2))
              })
            }
          }, true)
        }
      }}
      onMouseDown={e => {
        console.log(e)
      }}
      onMouseUp={e => {
        console.log(e)
        // handleClick()
      }}
      onTouchEnd={e => {
        console.log(e)
      }}
      size={{
        height: height || 'auto',
        width: width || 'auto'
      }}
      scale={flow.containerTransformScale}
    >
      {((name && type === 'group') || nodeState.locked) && (
        <Content
          flex
          gap={10}
          onClick={() => {
            handleClick()
          }}
          style={{
            position: 'absolute',
            cursor: nodeState.locked ? 'pointer' : 'inherit',
            width: nodeState.isEditingName ? '100%' : undefined
          }}
          className={nodeNameClassName}
        >
          {nodeState.locked && <Icon name="park-lock" />}
          <ChangeNameInput
            isEditing={nodeState.isEditingName}
            onEditStateChange={s => setNodeState(v => ({ ...v, isEditingName: s }))}
            onChange={name => {
              updateWhiteboard(w => {
                const origin = w.nodes?.get(id)
                origin &&
                  w.nodes?.set(id, {
                    ...origin,
                    name
                  })
              }, true)
            }}
            name={name || 'Unnamed'}
          />
        </Content>
      )}
      <AnimatePopover
        visible={!!nodeState.popoverVisible && !shouldDisplayCover && !nodeState.isEditingName}
        positions={['top']}
        parentElement={flow.parentContainerEle}
        reposition={false}
        disableNudge
        disableIntersection
        onClickOutside={e => {
          if (isResizingRef.current === false) {
            setNodeState(s => ({
              ...s,
              popoverVisible: false,
              selected: false,
              focused: false
            }))
          }
        }}
        padding={10}
        containerStyle={{ zIndex: String(Zindexes.ToolBar) }}
        content={
          <WithBorder
            onMouseDownCapture={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', gap: 6, padding: '2px 6px' }}
          >
            {renderPopoverElements()}
          </WithBorder>
        }
      >
        <Content
          flex
          column
          fullHeight
          alignItems="center"
          style={{
            minHeight: 'auto',
            maxHeight: '100%',
            borderRadius: 6
          }}
          onKeyUpCapture={e => {
            if (nodeState.focused || nodeState.locked) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
          onWheelCapture={e => {
            if (node.type !== 'group') {
              if (nodeState.focused || nodeState.locked) {
                e.stopPropagation()
              }
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Tab') {
              e.preventDefault()
            }
          }}
        >
          <div style={{ width: '100%', height: '100%', ...containerOverflow }}>{renderInnerNode()}</div>
          {showCover && (
            <div
              data-cover-id={node.id}
              onClick={e => {
                console.log(e)
                handleClick()
                e.stopPropagation()
              }}
              onPointerDownCapture={e => {
                const pointerMode = flow.parentContainerEle?.getAttribute('data-pointer-mode')
                if (pointerMode === 'pan') {
                  return
                }
                e.stopPropagation()
              }}
              style={{
                position: 'absolute',
                top: 0,
                pointerEvents: node.type === 'group' ? 'inherit' : 'auto',
                left: 0,
                width: '100%',
                height: '100%'
              }}
            ></div>
          )}
        </Content>
      </AnimatePopover>
    </Rnd>
  )
}

export default memo(WrapperNode)
