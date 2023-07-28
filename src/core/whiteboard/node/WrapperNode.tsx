import produce from 'immer'
import { CSSProperties, Dispatch, memo, ReactNode, SetStateAction, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useAddingEdges, useFlow, useSetWhiteboardEdges, useSetWhiteboardNodes } from '../hooks'
import { EdgePosition, IWhiteboardNode } from '~/typings'
import { useMemoizedFn, useRafFn, useSelectGlobalAtomValue, useToggle } from '@/hooks'
import { AnimatePopover, Content, Icon, IconWithPopover, Tooltip, WithBorder } from '@/components'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { Rnd } from 'react-rnd'
import Zindexes from '@/consts/zindex'
import { getNodeData, getRelativeHandlePosition, transformXY } from '../utils'
import { AnimatePresence, motion } from 'framer-motion'
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
import tinycolor from 'tinycolor2'
import { useUpdate } from 'react-use'
import useGroupDrag from './useGroupDrag'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts/key'
import Colors from '@/consts/colors'
import { nodeClassName, nodeNameClassName } from './nodeClasses'
import TextNode from '@/core/whiteboard/node/TextNode'
import { useScopedEventEmitter } from '@/events'
import { getSetting, SettingAtom } from '@/core'

type NodeInnerState = Partial<{
  popoverVisible: boolean
  expanded: boolean
  selected: boolean
  focused: boolean
  isEditingName: boolean
  locked: boolean
  keepRatioResize: boolean
}>
export interface InnerNodeProps {
  node: Partial<IWhiteboardNode>
  setPopoverElements?: Dispatch<SetStateAction<(() => ReactNode)[]>>
  setNodeState?: Dispatch<SetStateAction<NodeInnerState>>
  onNameChange?: (name: string) => void
}

const lockResizeElements = ['image', 'video']
const transparentBackgroundNodes = ['text']
const WrapperNode = ({ node }: { node: IWhiteboardNode }) => {
  const { x, y, type, name, id, background, width, height } = node
  const containerRef = useRef<HTMLDivElement>()

  const flow = useFlow()

  const setNodes = useSetWhiteboardNodes()
  const setEdges = useSetWhiteboardEdges()
  const [addingEdgeState, setAddingEdgeState] = useAddingEdges()
  const isDraggingRef = useRef(false)
  const isResizingRef = useRef(false)
  const innerNodeIdsRef = useRef(new Set<number>())
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

  const shouldKeepRatio = useSelectGlobalAtomValue(SettingAtom, s => s.whiteboard.imageResizeKeepRatio)
  const [visiblePopoverElements, setVisiblePopoverElements] = useState<((() => ReactNode) | undefined)[]>([
    () => (
      <Tooltip position="top" content="Remove">
        <Icon
          size={18}
          className={ClassName.circleButton(undefined, 4)}
          name="park-delete"
          onClick={() => {
            setNodes(nodes =>
              produce(nodes, draft => {
                draft.delete(id)
              })
            )
            setEdges(edges =>
              produce(edges, draft => {
                flow.NODE_TO_EDGE_MAP.get(id)?.forEach(l => {
                  draft.delete(l)
                })
              })
            )
          }}
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
                setNodes(nodes =>
                  produce(nodes, draft => {
                    const n = draft.get(id)
                    n &&
                      draft.set(id, {
                        ...n,
                        background: color === defaultBgColor ? undefined : color
                      })
                  })
                )
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
            console.log(getNodeState())
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
    setNodes(nodes =>
      produce(nodes, draft => {
        const inode = nodes.get(id)
        inode &&
          draft.set(id, {
            ...inode,
            name
          })
      })
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
      getNode: () => node
    })
  }
  const getInGroupNodes = () => {
    if (innerNodeIdsRef.current.size > 0) return
    if (type === 'group' && width && height) {
      flow.ID_TO_NODE_ELEMENT_MAP.forEach((node, id) => {
        if (
          node.boxIntersect({
            width,
            height,
            left: x,
            top: y
          })
        ) {
          innerNodeIdsRef.current.add(id)
        }
      })
    }
  }
  useEffect(() => {
    const container = containerRef.current
    if (addingEdgeState.isAdding && container) {
      const pointerHandler = (e: PointerEvent) => {
        if (e.type === 'pointerenter') {
          getInGroupNodes()
          setAddingEdgeState(s => ({
            ...s,
            targetNodeId: id
          }))
        }
        if (e.type === 'pointerleave') {
          setAddingEdgeState(s => ({
            ...s,
            targetNodeId: undefined
          }))
        }
        if (e.type === 'pointerup') {
          setAddingEdgeState({
            isAdding: false
          })
        }
      }
      const pointerMoveHandler = (e: PointerEvent) => {
        getInGroupNodes()
        if (innerNodeIdsRef.current.has(addingEdgeState.sourceNodeId)) {
          setAddingEdgeState(s => ({
            ...s,
            targetNodeId: undefined,
            targetPosition: undefined
          }))
          return
        }
        const containerBound = container.getBoundingClientRect()
        const position = getRelativeHandlePosition(
          {
            width: containerBound.width,
            height: containerBound.height
          },
          {
            x: e.clientX - containerBound.x,
            y: e.clientY - containerBound.y
          }
        )
        setAddingEdgeState(s => ({
          ...s,
          targetPosition: position,
          targetNodeId: id
        }))
      }
      container.addEventListener('pointermove', pointerMoveHandler)
      container.addEventListener('pointerenter', pointerHandler)
      container.addEventListener('pointerleave', pointerHandler)
      document.addEventListener('pointerup', pointerHandler)
      return () => {
        container.removeEventListener('pointerenter', pointerHandler)
        container.removeEventListener('pointerleave', pointerHandler)
        document.removeEventListener('pointerup', pointerHandler)
        container.removeEventListener('pointermove', pointerMoveHandler)
      }
    } else {
      innerNodeIdsRef.current.clear()
    }
  }, [addingEdgeState.isAdding])

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
      const pointerDownHandler = (e: PointerEvent) => {
        if (flow.hasMultiSelectBox) return
        if (!containerRef.current?.contains(e.target as HTMLElement) && isResizingRef.current === false) {
          setNodeState(s => ({ ...s, selected: false, focused: false }))
        }
      }
      document.addEventListener('pointerdown', pointerDownHandler)
      return () => {
        document.removeEventListener('pointerdown', pointerDownHandler)
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
      case 'webpage':
        return <WebpageNode node={node} />
      case 'note':
        return <NoteNode onNameChange={handleNameChange} node={node} />
      case 'pdf':
        return <PdfNode onNameChange={handleNameChange} node={node} />
      case 'text':
        return <TextNode node={node} />
    }
  }
  useLayoutEffect(() => {
    const container = containerRef.current
    if (container) {
      flow.resizeObserver.observe(container)
      return () => {
        flow.resizeObserver.unobserve(container)
      }
    }
  }, [])

  const { stringColor, darkenBackground, stringDefaultColor, lightenDefaultColor, opacityBackground, darkenSecondBackground } =
    useMemo(() => {
      const defaultColor = tinycolor('#c9c9c9')
      const stringDefaultColor = defaultColor.toString('rgb')
      const lightenDefaultColor = defaultColor.lighten(5).toString('rgb')
      const color = background ? tinycolor(background) : tinycolor('#c9c9c9')
      const stringColor = color.toString('rgb')
      const setting = getSetting()
      const isDarkMode = setting.general.darkMode
      const darkenSecondBackground = (background ? tinycolor(background) : tinycolor('#c9c9c9'))
        .darken(isDarkMode ? 30 : 10)
        .setAlpha(0.5)
        .toString('rgb')
      const darkenBackground = color.darken(20).toString('rgb')
      const lightenBackground = color.lighten(15).toString('rgb')
      const opacityBackground = color.setAlpha(0.2).toPercentageRgb()
      return {
        stringColor,
        darkenBackground,
        lightenBackground,
        stringDefaultColor,
        lightenDefaultColor,
        opacityBackground,
        darkenSecondBackground
      }
    }, [background])

  const rndRef = useRef<Rnd>()

  const getNodeBoxShadow = () => {
    if (nodeState.selected || nodeState.popoverVisible || nodeState.focused || nodeState.locked) {
      return '0 0 0 calc(2px * var(--zoom-level)) var(--darken-node-color, --node-color)'
    }
    if (transparentBackgroundNodes.includes(node.type)) {
      return undefined
    }
    if (stringColor) {
      return '0 0 0 calc(2px * var(--zoom-level)) var(--node-color)'
    }
  }
  const scopedEmitter = useScopedEventEmitter()
  const [mouseIn, toggleMouseIn] = useState(false)
  useEffect(() => {
    const pointerHandler = (e: PointerEvent) => {
      if (e.type === 'pointerenter') {
        toggleMouseIn(true)
      } else {
        toggleMouseIn(false)
      }
    }
    const container = containerRef.current
    if (container) {
      container.addEventListener('pointerenter', pointerHandler)
      container.addEventListener('pointerleave', pointerHandler)
      return () => {
        container.removeEventListener('pointerenter', pointerHandler)
        container.removeEventListener('pointerleave', pointerHandler)
      }
    }
  }, [])
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
        zIndex: type === 'group' ? -10000 : nodeState.expanded ? 1000 : undefined,
        cursor: addingEdgeState.isAdding ? 'pointer' : nodeState.focused || nodeState.locked ? 'auto' : 'grab',
        boxShadow: getNodeBoxShadow(),
        background:
          type === 'group'
            ? `rgba(${opacityBackground.r},${opacityBackground.g},${opacityBackground.b},${opacityBackground.a})`
            : node.background
            ? darkenSecondBackground
            : transparentBackgroundNodes.includes(node.type)
            ? 'transparent'
            : Colors.Background.Linear,
        pointerEvents:
          type === 'group'
            ? (nodeState.popoverVisible || nodeState.focused || nodeState.locked || nodeState.selected || addingEdgeState.isAdding) &&
              (addingEdgeState.sourceNodeId ? !innerNodeIdsRef.current.has(addingEdgeState.sourceNodeId) : true)
              ? 'auto'
              : 'none'
            : 'auto',
        '--node-color': background ? stringColor : lightenDefaultColor,
        '--darken-node-color': background ? darkenBackground : stringDefaultColor
      }}
      minWidth={160}
      // maxWidth={nodeState.expanded ? undefined : 250}
      lockAspectRatio={(lockResizeElements.includes(type) || nodeState.keepRatioResize) && shouldKeepRatio}
      disableDragging={nodeState.focused || nodeState.locked}
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
        isResizingRef.current = true
        rafUpdateEdge()
        if (node.type !== 'group') {
          const nodeData = getNodeData(node.id, flow)
          const bound = ele.getBoundingClientRect()
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
      resizeHandleWrapperStyle={{ pointerEvents: 'auto' }}
      onResizeStop={(e, dir, ele, delta, pos) => {
        const bound = ele.getBoundingClientRect()

        scopedEmitter.emit('whiteboard', {
          type: 'nodeResizeEnd'
        })
        setTimeout(() => {
          isResizingRef.current = false
        })
        setNodes(nodes =>
          produce(nodes, draft => {
            const origin = nodes.get(id)
            if (origin) {
              draft.set(id, {
                ...origin,
                x: pos.x,
                y: pos.y,
                height: bound.height / flow?.containerTransformScale,
                width: bound.width / flow?.containerTransformScale
              })
            }
          })
        )
      }}
      onDragStart={() => {
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
          console.log('drag stop')
          setNodes(nodes =>
            produce(nodes, draft => {
              const origin = nodes.get(id)
              if (origin) {
                draft.set(id, {
                  ...origin,
                  x: nodeData.transformedXY?.x,
                  y: nodeData.transformedXY.y
                })
              }
            })
          )
        }
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
            if (!nodeState.selected) {
              setNodeState(s => ({
                ...s,
                popoverVisible: true,
                selected: true
              }))
            } else {
              if (isDraggingRef.current === false) {
                setNodeState(s => ({
                  ...s,
                  popoverVisible: true,
                  selected: true,
                  focused: true
                }))
              }
            }
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
              setNodes(nodes =>
                produce(nodes, draft => {
                  const origin = nodes.get(id)
                  origin &&
                    draft.set(id, {
                      ...origin,
                      name
                    })
                })
              )
            }}
            name={name || 'Unnamed'}
          />
        </Content>
      )}
      <AnimatePopover
        visible={!!nodeState.popoverVisible && !addingEdgeState.isAdding && !nodeState.isEditingName}
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
            overflowY: 'overlay',
            overflowX: 'hidden',
            borderRadius: 6
          }}
          onWheelCapture={e => {
            e.stopPropagation()
          }}
          onKeyDown={e => {
            e.stopPropagation()
          }}
        >
          {renderInnerNode()}
          {!nodeState.focused && !nodeState.locked && (
            <div
              onClick={e => {
                if (isDraggingRef.current === false) {
                  setNodeState(s => ({
                    ...s,
                    popoverVisible: true,
                    selected: true,
                    focused: true
                  }))
                }
              }}
              style={{
                position: 'absolute',
                top: 0,
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
const inputClassName = css({
  padding: '2px 8px',
  lineHeight: 1,
  boxShadow: 'var(--darken-node-color) 0px 0px 0px calc(1px * var(--zoom-level))',
  transition: 'all 0.2s ease',
  letterSpacing: '-0.04px',
  color: 'inherit',
  background: Colors.Background.Linear,
  outline: 'none',
  border: 'none',
  width: '60%',
  minWidth: '200px',
  overflow: 'hidden',
  borderRadius: 6,
  ':focus': {
    boxShadow: 'var(--node-color) 0px 0px 0px calc(1px * var(--zoom-level))'
  }
})
const ChangeNameInput = ({
  name,
  onChange,
  isEditing = false,
  onEditStateChange
}: {
  name: string
  onChange: (name: string) => void
  isEditing?: boolean
  onEditStateChange?: (isEditing: boolean) => void
}) => {
  const [innerName, setInnerName] = useState(name)
  useEffect(() => {
    if (isEditing) {
      setInnerName(name)
    }
  }, [isEditing])
  const keyDownHandler: React.KeyboardEventHandler = e => {
    e.stopPropagation()
    if (isHotkey(KEY.Escape, e)) {
      onEditStateChange?.(false)
    }
    if (isHotkey(KEY.Enter, e)) {
      onEditStateChange?.(false)
      onChange?.(innerName)
    }
  }

  return isEditing ? (
    <input
      spellCheck="false"
      autoFocus
      value={innerName}
      onKeyDownCapture={keyDownHandler}
      className={inputClassName}
      onChange={e => setInnerName(e.target.value)}
    />
  ) : (
    <div className={ClassName.ellipsisFont(1)} style={{ textTransform: 'none' }}>
      {name || 'Unnamed Group'}
    </div>
  )
}
const NodeResizer = memo(({ position, nodeId }: { position: EdgePosition; nodeId: number }) => {
  const [visible, toggleVisible] = useToggle(false)
  const [isAddingEdge, setIsAddingEdge] = useAddingEdges()
  const nodeResizerEdgeRef = useRef<HTMLDivElement>(null)
  const getNodeStyle = (): CSSProperties => {
    const left =
      position === 'left'
        ? 'calc(50% - var(--resizer-size) * var(--zoom-level) / 2)'
        : position === 'top' || position === 'bottom'
        ? 'calc(50% - var(--resizer-size) * var(--zoom-level) / 2)'
        : undefined
    const top =
      position === 'top'
        ? 'calc(50% - var(--resizer-size) * var(--zoom-level) / 2)'
        : position === 'left' || position === 'right'
        ? 'calc(50% - var(--resizer-size) * var(--zoom-level) / 2)'
        : undefined
    const right = position === 'right' ? 'calc(50% - var(--resizer-size) * var(--zoom-level) / 2)' : undefined
    const bottom = position === 'bottom' ? 'calc(50% - var(--resizer-size) * var(--zoom-level) / 2)' : undefined
    return {
      left,
      top,
      right,
      bottom
    }
  }
  useEffect(() => {
    if (isAddingEdge.targetNodeId === nodeId) {
      toggleVisible(true)
    } else {
      toggleVisible(false)
    }
  }, [isAddingEdge.targetNodeId])
  const nodeStyle = useMemo(() => getNodeStyle(), [position])
  return (
    <div
      onPointerEnter={() => !isAddingEdge.isAdding && toggleVisible(true)}
      ref={nodeResizerEdgeRef}
      onPointerLeave={() => !isAddingEdge.isAdding && toggleVisible(false)}
      style={{
        '--resizer-size': '16px',
        width: '100%',
        height: '100%',
        '--resizer-bg': 'var(--node-color)',
        pointerEvents: 'auto'
      }}
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={e => {
              e.preventDefault()
              e.stopPropagation()
              setIsAddingEdge({
                isAdding: true,
                sourceNodeId: nodeId,
                sourcePosition: position
              })
            }}
            style={nodeStyle}
            className={resizerNodeClassName}
          ></motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

const resizerNodeClassName = css({
  width: 'calc(var(--resizer-size) * var(--zoom-level))',
  height: 'calc(var(--resizer-size) * var(--zoom-level))',
  position: 'absolute',
  cursor: 'pointer',
  ':after': {
    content: '""',
    borderRadius: '50%',
    border: '2px solid white',
    boxSizing: 'border-box',
    display: 'block',
    width: 'calc(var(--resizer-size) * var(--zoom-level))',
    height: 'calc(var(--resizer-size) * var(--zoom-level))',
    background: 'var(--resizer-bg)',
    position: 'relative',
    left: 0,
    top: 0
  }
})

export default memo(WrapperNode)
