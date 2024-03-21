import { CSSProperties, Dispatch, memo, ReactNode, SetStateAction, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useFlow } from '../StateHooks'
import { INodeInnerState, IWhiteboardNode } from '~/typings'
import { useIsIn, useMemoizedFn, useRafFn, useSelectAtomValue, useSelectGlobalAtomValue } from '@/hooks'
import { Content } from '@/components'
import { Rnd } from 'react-rnd'
import MetaObjectNode from './nodes/MetaObjectNode'
import ImageNode from './nodes/ImageNode'
import VideoNode from './nodes/VideoNode'
import WebpageNode from './nodes/WebpageNode'
import NoteNode from './nodes/NoteNode'
import PdfNode from './nodes/PdfNode'
import { useUpdate } from 'react-use'
import { nodeClassName } from './nodeClasses'
import TextNode from '@/core/components/whiteboard/node/nodes/TextNode'
import { SettingAtom } from '@/core'
import useAddingEdgeInsideNode from '@/core/components/whiteboard/hooks/useAddingEdgeInsideNode'
import GroupHead from './GroupHead'
import { NodeEventHandler } from '@/core/components/whiteboard/node/types'
import FreehandNode from '@/core/components/whiteboard/node/nodes/FreehandNode'
import useNodeColor from '@/core/components/whiteboard/node/hooks/useNodeColor'
import getNodeStyle from '@/core/components/whiteboard/node/getNodeStyle'
import useEraseNode from '@/core/components/whiteboard/node/hooks/useEraseNode'
import useNodeSize from '@/core/components/whiteboard/node/hooks/useNodeSize'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import { WhiteboardStateAtom } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import eventHandlers from '@/core/components/whiteboard/node/hooks/eventHandlers'
import useNodeResize from '@/core/components/whiteboard/node/hooks/useNodeResize'
import useNodeDrag from '@/core/components/whiteboard/node/hooks/useNodeDrag'
import { useAtomValue, useSetAtom } from 'jotai'
import MindmapNode from '@/core/components/whiteboard/node/mindmap/MindmapNode'
import AddSubMindmapIndicator from '@/core/components/whiteboard/node/mindmap/AddSubMindmapIndicator'
import getNodeSize from '@/core/components/whiteboard/node/getNodeSize'
import getNodeClassname from '@/core/components/whiteboard/node/getNodeClassname'
import classnames from 'classnames'
import { isEqual } from 'lodash'
import { selectAtom } from 'jotai/utils'
import useUpdateIsomorphicLayoutEffect from '@/hooks/utils/useUpdateIsomorphicLayoutEffect'

export type NodeInnerState = INodeInnerState
export interface InnerNodeProps {
  node: Partial<IWhiteboardNode>
  setPopoverElements?: Dispatch<SetStateAction<(() => ReactNode)[]>>
  setNodeState?: Dispatch<SetStateAction<NodeInnerState>>
  onNameChange?: (name: string) => void
  nodeState?: NodeInnerState
  metaId?: number
}

const NodeSelectAtom = selectAtom(
  WhiteboardStateAtom,
  s => ({
    pointerMode: s.pointerMode,
    hasEraseOrDrawTool: s.currentTool,
    isDraggingNode: s.isDraggingNode,
    currentHighlight: s.highlightedIds
  }),
  (a, b) => isEqual(a, b)
)
const lockResizeElements = ['image', 'video']

const WrapperNode = ({ node }: { node: IWhiteboardNode }) => {
  const { x, y, type, id, background, width, height } = node
  const eventHandlerRef = useRef<NodeEventHandler>()
  const flow = useFlow()

  const isDraggingRef = useRef(false)
  const isResizingRef = useRef(false)

  console.log('rerender')
  const [nodeState, setNodeState] = useState<NodeInnerState>({
    popoverVisible: false,
    expanded: false,
    selected: false,
    focused: false,
    locked: false,
    isEditingName: false,
    keepRatioResize: false
  })
  const containerRef = useRef<HTMLDivElement>()
  const { pointerMode, hasEraseOrDrawTool, isDraggingNode, currentHighlight } = useAtomValue(NodeSelectAtom)
  const panPointerMode = pointerMode === 'pan'
  const setWhiteboardState = useSetAtom(WhiteboardStateAtom)
  const instance = useWhiteboardInstance()
  const updateWhiteboard = instance.updateWhiteboard
  const eventHandler = eventHandlerRef.current
  const shouldKeepRatio = useSelectGlobalAtomValue(SettingAtom, s => s.whiteboard.imageResizeKeepRatio)

  instance.values.ID_TO_NODE_MAP.set(node.id, {
    setNodeState,
    getNodeDOM: () => {
      const d = containerRef.current
      if (!d) throw 'Failed to get DOM'
      return d
    },
    select: () => {
      if (nodeState.selected) return
      setNodeState(s => ({ ...s, selected: true }))
    },
    getNodeState: () => nodeState,
    deselect: () => {
      if (!nodeState.selected) return
      setNodeState(s => ({ ...s, selected: false, focused: false }))
    },
    setStyle: newStyle => {
      const container = containerRef.current
      if (container) {
        Object.entries(newStyle).forEach(([k, v]) => {
          container.style.setProperty(k, v)
        })
      }
    },
    getRealtimeBox: () => {
      const container = containerRef.current?.getBoundingClientRect()
      if (container) {
        const transformed = instance.coordOps?.transformWindowPositionToPosition({
          x: container.x,
          y: container.y
        })
        const scale = instance.getTransform?.().scale
        if (transformed && scale) {
          const trimNum = (n: number) => {
            return Number(n.toFixed(2))
          }
          return {
            width: trimNum(container.width / scale),
            height: trimNum(container.height / scale),
            left: transformed.x,
            top: transformed.y
          }
        }
      }
    },
    sizeAlreadyDefined: () => {
      if (isResizingRef.current) {
        return true
      }
      if (width && height && node.resized) {
        console.log(node)
        return true
      }
      return false
    },
    updateNodeBox: newBox => {
      const container = containerRef.current!
      container.style.width = `${newBox.width}px`
      container.style.height = `${newBox.height}px`
      container.style.transform = `translate(${newBox.left}px,${newBox.top}px)`
      rafUpdateEdge()
      eventHandler?.({
        type: 'resize',
        direction: 'both',
        newBox
      })
    }
  })

  const handleNameChange = useMemoizedFn((name: string) => {
    updateWhiteboard?.(
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

  useLayoutEffect(() => {
    return () => {
      instance.values.ID_TO_NODE_MAP.delete(node.id)
    }
  }, [])

  const rafUpdateEdge = useRafFn(() => {
    instance.nodeOps?.updateRelatedEdges(node.id)
  })
  useUpdateIsomorphicLayoutEffect(() => {
    if (containerRef.current) {
      rafUpdateEdge()
      rndRef.current?.updateOffsetFromParent()
    }
  }, [node.x, node.y, node.width, node.height])

  useEffect(() => {
    const element = containerRef.current
    if (element) {
      const { handleFunc, returnFunc } = eventHandlers({ element, node, instance, nodeState, isDraggingNode, setNodeState })
      handleFunc()
      return () => {
        returnFunc()
      }
    }
  })
  const { handleResizeEnd, handleResize, handleResizeStart } = useNodeResize(node, instance)
  const { handleDragStart, handleDrag, handleDragEnd } = useNodeDrag(node, instance)

  // remove selected state on click outside
  useEffect(() => {
    if (nodeState.selected || nodeState.focused) {
      instance.selectOps?.selectNode(node.id, false)
      const clickHandler = (e: MouseEvent) => {
        console.log(e, node)
        if (e.defaultPrevented) return
        // do not clear select state if selecting or resizing
        if (instance.selectOps?.isSelecting() || instance.values.isResizingSelectionBox) {
          return
        }
        if (!containerRef.current?.contains(e.target as HTMLElement) && isResizingRef.current === false) {
          if (e.target instanceof HTMLElement && e.target.getAttribute('data-cover-id') === `${node.id}`) return
          // click on container
          if (
            e.target instanceof HTMLElement &&
            e.target.getAttribute('role') === 'data-container' &&
            flow.parentContainerEle?.contains(e.target)
          ) {
            setNodeState(s => ({ ...s, selected: false, focused: false }))
          }
          // click on another node
          if (e.target instanceof HTMLElement) {
            const targetNode = e.target.closest('[data-node-id]')
            if (targetNode) {
              const nodeId = targetNode.getAttribute('data-node-id')!
              if (Number(nodeId) !== node.id) {
                setNodeState(s => ({ ...s, selected: false, focused: false }))
              }
            }
          }
        }
      }
      document.addEventListener('click', clickHandler)
      return () => {
        document.removeEventListener('click', clickHandler)
      }
    } else {
      if (!nodeState.selected && !nodeState.focused) {
        instance.selectOps?.deselectNode(node.id)
      }
    }
  }, [nodeState.selected, nodeState.focused])

  const forceRender = useUpdate()

  const renderInnerNode = (type: IWhiteboardNode['type']) => {
    switch (type) {
      case 'metaObject':
        return <MetaObjectNode onNameChange={handleNameChange} nodeState={nodeState} setNodeState={setNodeState} node={node} />
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
      case 'mindmap':
        return <MindmapNode nodeRenderer={renderInnerNode} parentNodeRef={containerRef} node={node} />
      case 'webpage':
        return <WebpageNode webpageId={node.webpageId} node={node} />
      case 'note':
        return <NoteNode nodeState={nodeState} onNameChange={handleNameChange} node={node} />
      case 'pdf':
        return <PdfNode onNameChange={handleNameChange} node={node} />
      case 'text':
        return <TextNode node={node} onClick={handleClick} nodeState={nodeState} />
    }
  }

  let containerOverflow: CSSProperties = {
    overflowX: 'hidden',
    overflowY: 'auto'
  }
  if (node.type === 'freehand') {
    containerOverflow = {}
  }

  useNodeSize(containerRef.current, node, instance)

  const { shouldDisplayCover, groupEnablePointer } = useAddingEdgeInsideNode(node, containerRef.current)
  const { stringColor, darkenBackground, lightenDefaultColor, opacityBackground } = useNodeColor(background, node.type)

  const rndRef = useRef<Rnd>()
  const { handlePointerEvent, isTouched, isErasing } = useEraseNode(node)
  useEffect(() => {
    const pointerHandler = (e: PointerEvent) => {
      handlePointerEvent(e)
      if (e.type === 'pointerup') {
        setTimeout(() => {
          if (!e.defaultPrevented) {
            if (node.type === 'group' && !node.name) {
              console.log(e)
              setNodeState(s => ({ ...s, selected: true, focused: true }))
            }
          }
        })
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

  if (node.collapse) return null
  const handleClick = (e: MouseEvent) => {
    if (isDraggingRef.current || panPointerMode) return
    const edgeOverlayState = instance.edgeOps?.getEdgeOverlayState()
    if (edgeOverlayState?.isReposition || edgeOverlayState?.isAdding) {
      return
    }
    // set timeout here to prevent remove node when cancel other node's select state
    setTimeout(() => {
      setNodeState(s => ({
        ...s,
        selected: true,
        focused: true
      }))
    })
    instance.selectOps?.selectNode(node.id, false)
  }
  const nodeStyle = getNodeStyle(node, nodeState, instance, {
    displayCover: shouldDisplayCover,
    groupEnablePointer: groupEnablePointer,
    isErased: isTouched,
    isErasing,
    panPointerMode,
    background: {
      opacityBackground
    }
  })

  let showCover = true

  if (nodeState.focused || nodeState.locked || node.type === 'group') {
    showCover = false
  }
  if (node.type === 'freehand' && !node.background) {
    showCover = false
  }
  const clazz = !panPointerMode && getNodeClassname(node)
  const { width: nodeWidth, height: nodeHeight, minWidth, maxWidth } = getNodeSize(node)

  return (
    <Rnd
      ref={node => {
        if (node) {
          rndRef.current = node
          if (!containerRef.current) {
            forceRender()
          }
          containerRef.current = node.getSelfElement()
        }
      }}
      data-node-type={node.type}
      data-node-id={id}
      position={{ x, y }}
      enableResizing={!hasEraseOrDrawTool && (nodeState.selected || nodeState.focused || node.type === 'group')}
      style={{
        ...nodeStyle,
        '--node-color': background ? stringColor : lightenDefaultColor,
        opacity: currentHighlight ? (currentHighlight.nodeIds.has(id) ? 1 : 0.2) : nodeStyle.opacity,
        '--darken-node-color': darkenBackground,
        cursor: hasEraseOrDrawTool ? 'crosshair' : nodeStyle.cursor,
        pointerEvents: hasEraseOrDrawTool === 'freehand' ? 'none' : nodeStyle.pointerEvents
      }}
      minWidth={minWidth}
      maxWidth={maxWidth}
      lockAspectRatio={(lockResizeElements.includes(type) || nodeState.keepRatioResize) && shouldKeepRatio}
      disableDragging={
        !!node.rootId ||
        hasEraseOrDrawTool ||
        (nodeState.focused && node.type !== 'group') ||
        nodeState.isEditingName ||
        nodeState.locked ||
        panPointerMode ||
        (node.type === 'group' && !nodeState.selected)
      }
      className={classnames(nodeClassName, clazz)}
      onResizeStart={e => {
        handleResizeStart(e)
      }}
      onResize={(e, dir, ele, delta) => {
        if (!rndRef.current) {
          throw new Error('Rnd not initialized!')
        }
        const { box, direction } = handleResize(e, dir, ele, delta, rndRef.current)
        isResizingRef.current = true
        if (node.type !== 'mindmap') {
          eventHandler?.({
            type: 'resize',
            direction,
            newBox: box
          })
        }
      }}
      resizeHandleWrapperStyle={{ pointerEvents: 'inherit' }}
      onResizeStop={(e, dir, ele, delta, pos) => {
        const box = handleResizeEnd()
        rndRef.current!.offsetFromParent = {
          top: 0,
          left: 0
        }
        setTimeout(() => {
          isResizingRef.current = false
        })

        updateWhiteboard?.(w => {
          const origin = w.nodes?.get(id)
          if (origin) {
            w.nodes?.set(id, {
              ...origin,
              x: box.left,
              y: box.top,
              widthResized:
                origin.widthResized ||
                (['left', 'right', 'topRight', 'topLeft', 'bottomRight', 'bottomLeft'].includes(dir) && delta.width !== 0),
              resized:
                origin.resized ||
                (['top', 'bottom', 'topRight', 'topLeft', 'bottomRight', 'bottomLeft'].includes(dir) && delta.height !== 0),
              height: box.height,
              width: box.width
            })
          }
        }, true)
      }}
      onDragStart={e => {
        if (!e.currentTarget.contains(e.target)) {
          throw ''
        }
        console.log(e)
        instance.nodeOps?.updateAfterZ?.(id)
        setWhiteboardState(s => ({ ...s, isDraggingNode: true }))
        handleDragStart()
        forceRender()
        instance.values.currentDraggingNodeId = node.id
        flow.isDraggingNode = true
      }}
      onDrag={(e, data) => {
        if (Math.abs(data.deltaX) > 2 || Math.abs(data.deltaY) > 2) {
          isDraggingRef.current = true
        }
        handleDrag(e, data, node.type === 'mindmap' ? false : isDraggingRef.current)
      }}
      onDragStop={(e, data) => {
        instance.values.currentDraggingNodeId = undefined
        setWhiteboardState(s => ({ ...s, isDraggingNode: false }))
        flow.isDraggingNode = false
        setTimeout(() => {
          isDraggingRef.current = false
        })
        if (Math.abs(data.x - x) < 1 && Math.abs(data.y - y) < 1) return
        const box = handleDragEnd(e, data)
        if (box) {
          updateWhiteboard?.(w => {
            const origin = w.nodes?.get(id)
            if (origin) {
              w.nodes?.set(id, {
                ...origin,
                x: box.left,
                y: box.top
              })
            }
          }, true)
        }
      }}
      onMouseDown={e => {
        if (panPointerMode) return
        if (node.rootId && !nodeState.selected && !nodeState.focused && e.button === 0) {
          instance.mindmapOps?.startDragMindmapChild(node.id, e)
        }
      }}
      size={{
        height: nodeHeight,
        width: nodeWidth
      }}
      scale={flow.containerTransformScale}
    >
      {node.borderType === 'underline' && node.type === 'mindmap' && (node.border || node.edgeColor) && (
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            height: 4,
            backgroundColor: node.border || node.edgeColor,
            width: '100%',
            zIndex: -100
          }}
        ></div>
      )}
      {showCover && (
        <div
          data-cover-id={node.id}
          onClick={e => {
            handleClick(e)
          }}
          onPointerDownCapture={e => {
            const pointerMode = flow.parentContainerEle?.getAttribute('data-pointer-mode')
            if (pointerMode === 'pan' || e.button === 1) {
              return
            }
            e.stopPropagation()
          }}
          style={{
            position: 'absolute',
            top: 0,
            pointerEvents: 'inherit',
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 100
          }}
        ></div>
      )}
      {type === 'group' && (
        <GroupHead
          nodeState={nodeState}
          isEditing={nodeState.isEditingName}
          setNodeState={setNodeState}
          node={node}
          onClick={() => {
            setNodeState(s => ({ ...s, selected: true, focused: true }))
          }}
          onPointerLeave={() => {
            if (nodeState.focused) return
            setNodeState(s => ({ ...s, selected: false }))
          }}
          onPointerEnter={() => {
            setNodeState(s => ({ ...s, selected: true }))
          }}
        />
      )}

      {type !== 'group' && (
        <Content
          fullHeight
          fullWidth
          role={'scroll-container'}
          style={{
            maxHeight: '100%',
            '--global-background': nodeStyle.background,
            borderRadius: 'inherit',
            ...containerOverflow
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
        >
          {renderInnerNode(node.type)}
        </Content>
      )}
      <AddSubMindmapIndicator node={node} containerRef={containerRef} />
    </Rnd>
  )
}

export default memo(WrapperNode)
