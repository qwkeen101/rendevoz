import { FC, memo, MouseEventHandler, useEffect, useMemo, useRef, useState } from 'react'
import { IWhiteboardEdge } from '~/typings'
import { IsAddingEdgeAtom, useFlow, WhiteboardAtom } from './hooks'
import { getBezierPath, getEdgeData, transformXY } from './utils'
import { getMarkerId } from '../graph/utils/getMarkerId'
import { MarkerColor } from '@/consts'
import { motion } from 'framer-motion'
import { Position } from '@/types'
import { AnimatePopover, Content, Icon, IconWithPopover, Tooltip, WithBorder } from '@/components'
import Zindexes from '@/consts/zindex'
import { useSelectAtomValue, useToggle, useUpdateEffect } from '@/hooks'
import BlockColorPicker from '../editor/components/BlockColorPicker'
import { defaultBgColor } from '@/components/picker/colorPicker'
import ClassName from '@/styles/classNames'
import { createPortal } from 'react-dom'
import { hexToRgb } from '@/utils/color'
import useClickOutside from '@/hooks/utils/useClickOutside'
import { throttle } from 'lodash'
import Colors from '@/consts/colors'
import { css, keyframes } from '@emotion/css'
import FontSize from '@/consts/font'
import { getSmoothPolyPath } from '@/core/whiteboard/utils/getSmoothPoly'
import { useSetAtom } from 'jotai'
import { disableAllUserSelect } from '@/components/base/ResizeAndDrag'
import { useTranslation } from 'react-i18next'
import useEraseEdge from '@/core/whiteboard/useEraseEdge'
import { useWhiteboardInstance } from '@/core/whiteboard/hooks/useWhiteboardInstance'

const keyframe = keyframes({
  '0%': {
    strokeDashoffset: 10
  }
})

export const animatedEdgeClazz = css({
  strokeDasharray: 5,
  animation: `${keyframe} 0.5s linear infinite`
})
export const dashEdgeClazz = css({
  strokeDasharray: 5
})

const TreeEdge: FC<{
  edge: IWhiteboardEdge
}> = memo(({ edge }) => {
  const { id, sourceId, targetId, targetPosition = 'left', sourcePosition = 'right', metaLinkId, lineType, lineStyle = 'straight' } = edge
  const [innerLink, setInnerLink] = useState<Partial<IWhiteboardEdge>>(edge)
  const [isEditingLabel, toggleIsEditingLabel] = useToggle(false)
  const defaultLineType = useSelectAtomValue(WhiteboardAtom, s => s?.lineType)
  const realLineType = lineType || defaultLineType
  const labelRef = useRef<HTMLDivElement>(null)
  const labelContainerRef = useRef<SVGGElement>(null)
  const setAddingEdge = useSetAtom(IsAddingEdgeAtom)
  const flow = useFlow()
  const { handlePointerEvent, isTouched, isErasing } = useEraseEdge(id)
  const edgeRef = useRef<SVGPathElement>(null)
  const instance = useWhiteboardInstance()

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
      if (realLineType === 'curve') {
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
      if (realLineType === 'straight') {
        const path = `M ${TSX},${TSY} L ${TTX},${TTY}`
        edgeRef.current?.setAttribute('d', path)
        pathRef.current = path
        labelContainerRef.current?.setAttribute('transform', `translate(${(TSX + TTX) / 2} ${(TSY + TTY) / 2})`)
      }
      if (realLineType === 'polyline') {
        const [path, labelX, labelY] = getSmoothPolyPath({
          sourceX: TSX,
          sourceY: TSY,
          sourcePosition,
          targetPosition,
          targetX: TTX,
          targetY: TTY,
          borderRadius: 4
        })
        edgeRef.current?.setAttribute('d', path)
        pathRef.current = path
        labelContainerRef.current?.setAttribute('transform', `translate(${labelX} ${labelY})`)
      }
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
  }, [sourceId, targetId])

  const clickHandler: MouseEventHandler = e => {
    const container = flow?.containerEle
    const edgeData = getEdgeData(sourceId, targetId, sourcePosition, targetPosition, flow)

    if (edgeData && container) {
      const { sourceX, sourceY, targetX, targetY } = edgeData
      const containerBound = container.getBoundingClientRect()
      const { x: TSX, y: TSY } = transformXY(containerBound, sourceX, sourceY, flow.containerTransformScale)
      const { x: TTX, y: TTY } = transformXY(containerBound, targetX, targetY, flow.containerTransformScale)
      const s = getSmoothPolyPath({
        sourceX: TSX,
        sourceY: TSY,
        sourcePosition,
        targetPosition,
        targetX: TTX,
        targetY: TTY,
        borderRadius: 4
      })
      console.log(s.pop())
    }
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

  const handlePointerDown = (e: PointerEvent) => {
    const node = e.currentTarget as SVGElement
    const bounding = node.getBoundingClientRect()
    const edgeData = getEdgeData(sourceId, targetId, sourcePosition, targetPosition, flow)
    if (!edgeData) return
    document.body.classList.add(disableAllUserSelect)
    const center = bounding.left + bounding.width / 2
    let drag = 'dragSource'

    if (e.clientX < center) {
      if (edgeData.sourceX > edgeData.targetX) {
        drag = 'dragTarget'
      }
    } else {
      if (edgeData.sourceX < edgeData.targetX) {
        drag = 'dragTarget'
      }
    }

    // right to left

    const currPos = {
      x: e.clientX,
      y: e.clientY
    }
    let inited = false
    const globalPointerMoveHandler = (e: PointerEvent) => {
      const curr = {
        x: e.clientX,
        y: e.clientY
      }

      if (!inited && (Math.abs(curr.x - currPos.x) > 10 || Math.abs(curr.y - currPos.y) > 10)) {
        inited = true
        node.style.display = 'none'
        if (drag === 'dragSource') {
          setAddingEdge(s => ({
            isAdding: false,
            currentEdgeId: id,
            isReposition: true,
            currentRepositionEnd: 'source',
            targetPosition,
            targetNodeId: targetId
          }))
        } else {
          setAddingEdge(s => ({
            isAdding: false,
            currentEdgeId: id,
            isReposition: true,
            currentRepositionEnd: 'target',
            sourcePosition,
            sourceNodeId: sourceId
          }))
        }

        document.removeEventListener('pointermove', globalPointerMoveHandler)
      }
    }
    const globalPointerUpHandler = () => {
      node.style.display = 'unset'
      document.body.classList.remove(disableAllUserSelect)
      document.removeEventListener('pointermove', globalPointerMoveHandler)
      document.removeEventListener('pointerup', globalPointerUpHandler)
    }
    document.addEventListener('pointermove', globalPointerMoveHandler)
    document.addEventListener('pointerup', globalPointerUpHandler)
  }
  useUpdateEffect(() => {
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
      if (innerLink.label && innerLink.label !== edge.label) {
        updateEdge({ label: innerLink.label })
      }
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
    instance.updateEdge?.(id, e => ({ ...e, ...edge }))
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
  useEffect(() => {
    drawPath()
  }, [sourceId, sourcePosition, targetPosition, targetId, realLineType])

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
            <WithBorder style={{ display: 'flex', gap: 6, padding: '2px 6px', alignItems: 'center' }}>
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
                      updateEdge({
                        color: c === defaultBgColor ? undefined : c
                      })
                    }}
                    showMoreBg={false}
                    showBg
                    showFont={false}
                  />
                }
              ></IconWithPopover>
              <IconWithPopover
                size={18}
                name="custom-straight"
                className={ClassName.circleButton(undefined, 4)}
                content={
                  <EdgeStylePicker
                    onChange={v => {
                      updateEdge({
                        ...v
                      })
                      setInnerLink({
                        ...innerLink,
                        ...v
                      })
                    }}
                    edge={{ lineType: realLineType, lineStyle }}
                  />
                }
              />
              <Icon
                name="park-delete"
                onClick={() => {
                  instance.deleteEdge?.(id)
                }}
                className={ClassName.circleButton(undefined, 4)}
                size={18}
              />
            </WithBorder>
          }
          disableIntersection
          position={{
            left: popoverState.position?.left,
            top: popoverState.position?.top
          }}
          containerStyle={{
            zIndex: String(Zindexes.ToolBar)
          }}
        ></AnimatePopover>,
        document.body
      )}
      <g
        onClick={clickHandler}
        onPointerDown={handlePointerDown}
        style={{
          pointerEvents: 'none',
          cursor: isErasing ? 'crosshair' : 'pointer',
          opacity: isTouched ? 0.3 : 1
        }}
      >
        {isIn && !isErasing && (
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
          className={lineStyle === 'animatedDash' ? animatedEdgeClazz : lineStyle === 'dash' ? dashEdgeClazz : undefined}
          onPointerEnter={e => {
            setIsIn(true)
            handlePointerEvent(e)
          }}
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
          <foreignObject
            ref={labelContainerRef}
            width={1}
            height={1}
            style={{ overflow: 'visible', pointerEvents: 'auto' }}
            onPointerDown={e => e.stopPropagation()}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: 'max-content',
                height: 'fit-content',
                pointerEvents: 'none'
              }}
            >
              <div
                ref={labelRef}
                contentEditable={true}
                spellCheck="false"
                className={EdgeClassName}
                onClick={() => setTimeout(() => toggleIsEditingLabel(true))}
                style={{
                  maxWidth: '16em',
                  fontSize: FontSize['14px'],
                  padding: '6px'
                }}
                onInput={e => {
                  setInnerLink({
                    ...innerLink,
                    label: e.currentTarget.innerText || ''
                  })
                }}
              ></div>
            </div>
          </foreignObject>
        )}
      </g>
    </>
  )
})
const types = [
  {
    icon: 'custom-straight',
    value: 'straight',
    children: 'straight'
  },
  {
    icon: 'custom-curve',
    value: 'curve',
    children: 'curve'
  },
  {
    icon: 'park-connection',
    value: 'polyline',
    children: 'step'
  }
]
const styles = [
  {
    icon: 'custom-straight-no-arrow',
    value: 'straight',
    children: 'straight'
  },
  {
    icon: 'custom-dash',
    value: 'dash',
    children: 'dash'
  },
  { icon: 'custom-animated-dash', value: 'animatedDash', children: 'animated' }
]
const EdgeStylePicker = ({ edge, onChange }: { edge: Partial<IWhiteboardEdge>; onChange: (newProps: any) => void }) => {
  const { t } = useTranslation()
  return (
    <WithBorder style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className={ClassName.description(FontSize['12px'])}>{t('general.Line type')}</div>
      <Content flex gap={6}>
        {types.map(i => (
          <Icon
            onClick={() => onChange({ lineType: i.value })}
            name={i.icon}
            style={{
              background: edge.lineType === i.value ? Colors.Background.ButtonActive : undefined
            }}
            key={i.icon}
            className={ClassName.flatButton(4, '4px 12px')}
          />
        ))}
      </Content>
      <div className={ClassName.description(FontSize['12px'])}>{t('general.Line style')}</div>
      <Content flex gap={6}>
        {styles.map(i => (
          <Icon
            onClick={() => onChange({ lineStyle: i.value })}
            style={{
              background: edge.lineStyle === i.value ? Colors.Background.ButtonActive : undefined
            }}
            name={i.icon}
            key={i.icon}
            className={ClassName.flatButton(4, '4px 12px')}
          />
        ))}
      </Content>
    </WithBorder>
  )
}
const EdgeClassName = css({
  transform: 'translateX(-50%) translateY(-50%)',
  outline: 'none',
  borderRadius: 4,
  lineHeight: 1.3,
  background: Colors.Background.Secondary,
  whiteSpace: 'pre-wrap',
  pointerEvents: 'auto',
  fontWeight: 500,
  cursor: 'text',
  textTransform: 'none'
})
export default TreeEdge
