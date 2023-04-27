import { FC, memo, useEffect, useRef, useState, MouseEventHandler, useMemo } from 'react'
import { IWhiteboardEdge } from '~/typings'
import { useFlow, useSetWhiteboardEdges } from './hooks'
import { getBezierPath, getEdgeData, transformXY } from './utils'
import { getMarkerId } from '../graph/utils/getMarkerId'
import { MarkerColor } from '@/consts'
import { motion } from 'framer-motion'
import { Position } from '@/types'
import { AnimatePopover, Icon, IconWithPopover, Tooltip, WithBorder } from '@/components'
import Zindexes from '@/consts/zindex'
import { useToggle } from '@/hooks'
import BlockColorPicker from '../editor/components/BlockColorPicker'
import { defaultBgColor } from '@/components/picker/colorPicker'
import ClassName from '@/styles/classNames'
import produce from 'immer'
import { createPortal } from 'react-dom'
import { hexToRgb } from '@/utils/color'
import useClickOutside from '@/hooks/utils/useClickOutside'
import { throttle } from 'lodash'
import Colors from '@/consts/colors'
import { css } from '@emotion/css'
import FontSize from '@/consts/font'

const TreeEdge: FC<{
  edge: IWhiteboardEdge
}> = memo(({ edge }) => {
  const { id, sourceId, targetId, targetPosition = 'left', sourcePosition = 'right', metaLinkId } = edge
  const [innerLink, setInnerLink] = useState<Partial<IWhiteboardEdge>>(edge)
  const [isEditingLabel, toggleIsEditingLabel] = useToggle(false)

  const labelRef = useRef<HTMLDivElement>(null)
  const labelContainerRef = useRef<SVGGElement>(null)

  const flow = useFlow()

  const edgeRef = useRef<SVGPathElement>(null)

  const setEdges = useSetWhiteboardEdges()

  const pathRef = useRef<string>()

  const [popoverState, setPopoverState] = useState<
    Partial<{
      visible: boolean
      position: Position
    }>
  >({
    visible: false
  })
  const underEdgeRef = useRef<SVGPathElement>(null)

  const drawPath = () => {
    const container = flow?.containerEle
    const edgeData = getEdgeData(sourceId, targetId, sourcePosition, targetPosition, flow)

    if (edgeData && container) {
      const { sourceX, sourceY, targetX, targetY } = edgeData
      const containerBound = container.getBoundingClientRect()
      const { x: TSX, y: TSY } = transformXY(containerBound, sourceX, sourceY, flow.containerTransformScale)
      const { x: TTX, y: TTY } = transformXY(containerBound, targetX, targetY, flow.containerTransformScale)
      const [path, labelX, labelY] = getBezierPath({
        sourceX: TSX,
        sourceY: TSY,
        targetX: TTX,
        targetY: TTY,
        sourcePosition,
        targetPosition
      })
      edgeRef.current?.setAttribute('d', path)
      pathRef.current = path
      labelContainerRef.current?.setAttribute('transform', `translate(${labelX} ${labelY})`)
    }
  }

  flow?.ID_TO_EDGE_MAP.set(id, {
    drawPath,
    element: edgeRef.current
  })

  useEffect(() => {
    drawPath()
    const nodeToEdgesMap = flow.NODE_TO_EDGE_MAP
    const ss = nodeToEdgesMap.get(sourceId)
    ss ? ss.add(id) : nodeToEdgesMap.set(sourceId, new Set([id]))
    const ts = nodeToEdgesMap.get(targetId)
    ts ? ts.add(id) : nodeToEdgesMap.set(targetId, new Set([id]))
    return () => {
      nodeToEdgesMap.get(sourceId)?.delete(id)
      nodeToEdgesMap.get(targetId)?.delete(id)
    }
  }, [])
  const clickHandler: MouseEventHandler = e => {
    setPopoverState(s => ({
      visible: !s.visible,
      position: {
        left: e.clientX,
        top: e.clientY
      }
    }))
  }

  const rgb = useMemo(() => hexToRgb(innerLink?.color || MarkerColor.NORMAL), [innerLink?.color])
  useEffect(() => {
    if (labelRef.current) {
      labelRef.current.textContent = edge.label || ''
    }
  }, [edge?.label])
  useEffect(() => {
    if (isEditingLabel) {
      const keydownHandler = (e: KeyboardEvent) => {
        e.stopPropagation()
      }
      document.addEventListener('keydown', keydownHandler, true)
      drawPath()
      labelRef.current?.focus()
      return () => {
        document.removeEventListener('keydown', keydownHandler, true)
      }
    } else {
      updateEdge({ label: innerLink.label })
    }
  }, [isEditingLabel])
  const [isIn, setIsIn] = useState(false)
  useClickOutside(
    () => {
      toggleIsEditingLabel(false)
    },
    labelContainerRef,
    isEditingLabel
  )

  const updateEdge = (edge: Partial<IWhiteboardEdge>) => {
    setEdges(_edges =>
      produce(_edges, draft => {
        const origin = _edges.get(id)
        if (origin) {
          draft.set(id, { ...origin, ...edge })
        }
      })
    )
  }
  useEffect(() => {
    if (isIn) {
      const pointerMoveHandler = throttle((e: PointerEvent) => {
        if (!(e.target instanceof SVGElement && (edgeRef.current?.contains(e.target) || underEdgeRef.current?.contains(e.target)))) {
          setIsIn(false)
        }
      }, 20)
      document.addEventListener('pointermove', pointerMoveHandler)
      return () => {
        document.removeEventListener('pointermove', pointerMoveHandler)
      }
    }
  }, [isIn])
  return (
    <>
      {createPortal(
        <AnimatePopover
          visible={!!popoverState.visible}
          onClickOutside={() => setPopoverState({ ...popoverState, visible: false })}
          positions={['top', 'bottom']}
          padding={10}
          disableNudge
          reposition={false}
          content={
            <WithBorder style={{ display: 'flex', gap: 6, padding: '2px 6px' }}>
              <Tooltip content="Change Edge Label">
                <Icon
                  className={ClassName.circleButton(undefined, 4)}
                  size={18}
                  name="park-edit"
                  onClick={() => setTimeout(toggleIsEditingLabel)}
                ></Icon>
              </Tooltip>
              <IconWithPopover
                padding={10}
                tooltip="Change Edge Color"
                tooltipPosition="top"
                className={ClassName.circleButton(undefined, 4)}
                size={18}
                name="park-background-color"
                content={
                  <BlockColorPicker
                    onPickBackgroundColor={c => {
                      setInnerLink({
                        ...innerLink,
                        color: c === defaultBgColor ? undefined : c
                      })
                      updateEdge({ color: c === defaultBgColor ? undefined : c })
                    }}
                    showMoreBg={false}
                    showBg
                    showFont={false}
                  />
                }
              ></IconWithPopover>
              <Icon
                name="park-delete"
                onClick={() => {
                  setEdges(edges =>
                    produce(edges, draft => {
                      draft.delete(id)
                    })
                  )
                }}
                className={ClassName.circleButton(undefined, 4)}
                size={18}
              />
            </WithBorder>
          }
          disableIntersection
          containerStyle={{
            zIndex: String(Zindexes.ToolBar)
          }}
        >
          <div
            style={{
              position: 'fixed',
              left: popoverState.position?.left,
              top: popoverState.position?.top
            }}
          ></div>
        </AnimatePopover>,
        document.body
      )}
      <g
        onClick={clickHandler}
        style={{
          pointerEvents: 'none',
          cursor: 'pointer'
        }}
      >
        {isIn && (
          <motion.path
            ref={underEdgeRef}
            pointerEvents="auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            stroke={`rgba(${rgb?.r},${rgb?.g},${rgb?.b},0.2)`}
            strokeWidth={'calc(16 * var(--zoom-level)'}
            transition={{ duration: 0.2 }}
            fill="none"
            d={pathRef.current}
          />
        )}
        <motion.path
          onPointerEnter={() => setIsIn(true)}
          pointerEvents="auto"
          ref={edgeRef}
          fill="none"
          markerEnd={`url(#${getMarkerId('end', innerLink?.color || MarkerColor.LIGHTGREY)})`}
          stroke={innerLink?.color || MarkerColor.LIGHTGREY}
          strokeWidth={'calc(2 * var(--zoom-level))'}
          animate={{
            strokeWidth: isIn ? 'calc(4 * var(--zoom-level)' : 'calc(2 * var(--zoom-level))'
          }}
        ></motion.path>
        {(innerLink?.label || isEditingLabel || edge.label) && (
          <foreignObject ref={labelContainerRef} width={1} height={1} style={{ overflow: 'visible', pointerEvents: 'auto' }}>
            <div onClick={e => e.stopPropagation()} style={{ width: 'max-content', height: 'fit-content', pointerEvents: 'none' }}>
              <div
                ref={labelRef}
                contentEditable={true}
                spellCheck="false"
                className={EdgeClassName}
                onClick={() => setTimeout(() => toggleIsEditingLabel(true))}
                style={{
                  boxShadow: `0 0 0 calc(4px * var(--zoom-level)) ${innerLink?.color || MarkerColor.LIGHTGREY}`,
                  maxWidth: '16em',
                  fontSize: FontSize['18px'],
                  padding: '6px'
                }}
                onInput={e => {
                  setInnerLink({ ...innerLink, label: e.currentTarget.innerText || '' })
                }}
              ></div>
            </div>
          </foreignObject>
        )}
      </g>
    </>
  )
})

const EdgeClassName = css({
  transform: 'translateX(-50%) translateY(-50%)',
  outline: 'none',
  borderRadius: 4,
  lineHeight: 1.3,
  background: Colors.Background.Secondary,
  whiteSpace: 'pre-wrap',
  pointerEvents: 'auto',
  fontWeight: 600,
  cursor: 'text',
  textTransform: 'none'
})
export default TreeEdge
