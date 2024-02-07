import { FC, memo, MouseEventHandler, useEffect, useRef, useState } from 'react'
import { IWhiteboardEdge, XYPosition } from '~/typings'
import { WhiteboardAtom } from '../StateHooks'
import { getBezierPath, getEdgeData } from '../utils'
import { getMarkerId } from '../../graph/utils/getMarkerId'
import { MarkerColor } from '@/consts'
import { useSelectAtomValue, useToggle, useUpdateEffect } from '@/hooks'
import Colors from '@/consts/colors'
import { css, keyframes } from '@emotion/css'
import FontSize from '@/consts/font'
import { getSmoothPolyPath } from '@/core/components/whiteboard/utils/getSmoothPoly'
import useEraseEdge from '@/core/components/whiteboard/edge/useEraseEdge'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import { EdgeOverlayStateAtom } from '@/core/components/whiteboard/edge/EdgeOverlay'
import { WhiteboardStateAtom } from '@/core/components/whiteboard/hooks/useWhiteboardState'

const keyframe = keyframes({
  '0%': {
    strokeDashoffset: 16
  }
})

export const animatedEdgeClazz = css({
  strokeDasharray: 8,
  animation: `${keyframe} 0.5s linear infinite`
})
export const dashEdgeClazz = css({
  strokeDasharray: 8
})

const TreeEdge: FC<{
  edge: IWhiteboardEdge
  lineType?: IWhiteboardEdge['lineType']
  hideArrow?: boolean
}> = memo(({ edge, lineType: outLineType, hideArrow = false }) => {
  const { id, sourceId, targetId, targetPosition = 'left', sourcePosition = 'right', metaLinkId, lineType, lineStyle = 'straight' } = edge
  const [innerLink, setInnerLink] = useState<Partial<IWhiteboardEdge>>(edge)
  const [isEditingLabel, toggleIsEditingLabel] = useToggle(false)
  const defaultLineType = outLineType ?? useSelectAtomValue(WhiteboardAtom, s => s?.lineType)
  const currentHighlight = useSelectAtomValue(WhiteboardStateAtom, s => s.highlightedIds)
  const realLineType = lineType || defaultLineType
  const labelRef = useRef<HTMLDivElement>(null)
  const labelContainerRef = useRef<SVGGElement>(null)
  const isReposition = useSelectAtomValue(EdgeOverlayStateAtom, s => s.isReposition)
  const currentEdgeId = useSelectAtomValue(EdgeOverlayStateAtom, s => s.currentEdgeId)
  const { handlePointerEvent, isTouched, isErasing } = useEraseEdge(id)
  const edgeRef = useRef<SVGPathElement>(null)
  const instance = useWhiteboardInstance()
  const pathRef = useRef<string>()
  const labelPosRef = useRef<XYPosition>()
  const underEdgeRef = useRef<SVGPathElement>(null)

  const drawPath = () => {
    const edgeData = getEdgeData(sourceId, targetId, sourcePosition, targetPosition, instance)
    if (edgeData) {
      const { sourceXY, targetXY } = edgeData
      let path = ''
      let labelX = 0
      let labelY = 0
      if (realLineType === 'curve') {
        ;[path, labelX, labelY] = getBezierPath({
          sourceX: sourceXY.x,
          sourceY: sourceXY.y,
          targetX: targetXY.x,
          targetY: targetXY.y,
          sourcePosition,
          targetPosition
        })
      }
      if (realLineType === 'straight') {
        path = `M ${sourceXY.x},${sourceXY.y} L ${targetXY.x},${targetXY.y}`
        labelX = (sourceXY.x + targetXY.x) / 2
        labelY = (sourceXY.y + targetXY.y) / 2
      }
      if (realLineType === 'polyline') {
        ;[path, labelX, labelY] = getSmoothPolyPath({
          sourceX: sourceXY.x,
          sourceY: sourceXY.y,
          sourcePosition,
          targetPosition,
          targetX: targetXY.x,
          targetY: targetXY.y,
          borderRadius: 4
        })
      }
      edgeRef.current?.setAttribute('d', path)
      underEdgeRef.current?.setAttribute('d', path)
      pathRef.current = path
      labelPosRef.current = {
        x: labelX,
        y: labelY
      }
      labelContainerRef.current?.setAttribute('transform', `translate(${labelX} ${labelY})`)
    }
  }

  instance.values.ID_TO_EDGE_MAP.set(id, {
    drawPath,
    edit: () => toggleIsEditingLabel(true)
  })

  useEffect(() => {
    drawPath()
  }, [sourceId, targetId])

  const clickHandler: MouseEventHandler = e => {
    const pos = instance.coordOps?.transformWindowPositionToPosition({ x: e.clientX, y: e.clientY })
    if (pos) {
      instance.toolbarOps?.openEdgeToolbar(edge.id, pos)
    }
  }

  useEffect(() => {
    if (labelRef.current) {
      labelRef.current.textContent = edge.label || ''
    }
  }, [edge?.label])

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault()
    const node = e.currentTarget as SVGElement
    const nextPointerHandler = (e: PointerEvent) => {
      if (e.type === 'pointerup') {
        node.removeEventListener('pointermove', nextPointerHandler)
        document.removeEventListener('pointerup', nextPointerHandler)
      }
      if (e.type === 'pointermove') {
        if (Math.abs(e.movementX) >= 1 || Math.abs(e.movementY) >= 1) {
          const node = e.currentTarget as SVGElement
          const bounding = node.getBoundingClientRect()
          const { sourceXY, targetXY } = getEdgeData(sourceId, targetId, sourcePosition, targetPosition, instance)
          const center = bounding.left + bounding.width / 2
          let drag: 'source' | 'target' = 'source'

          if (e.clientX < center) {
            if (sourceXY.x > targetXY.x) {
              drag = 'target'
            }
          } else {
            if (sourceXY.x < targetXY.x) {
              drag = 'target'
            }
          }
          const mousePos = instance.coordOps?.transformWindowPositionToPosition({ x: e.clientX, y: e.clientY })
          if (mousePos) {
            instance.edgeOps?.repositionEdge(edge.id, drag, mousePos)
          }
        }
      }
    }

    if (e.button === 0) {
      node.addEventListener('pointermove', nextPointerHandler)
      document.addEventListener('pointerup', nextPointerHandler)
    }

    // right to left
  }
  useUpdateEffect(() => {
    if (isEditingLabel) {
      const bounding = labelRef.current?.getBoundingClientRect()
      const transform = instance.getTransform?.()
      if (bounding && transform && labelPosRef.current) {
        const width = bounding.width / transform.scale
        const height = bounding.height / transform.scale
        const labelBox = {
          left: labelPosRef.current.x - width * 0.5,
          top: labelPosRef.current.y - height * 0.5,
          width,
          height
        }
        instance.containerOps?.fitTo(labelBox, { maxScale: 1 })
      }
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
      if (innerLink.label !== undefined && innerLink.label !== edge.label) {
        updateEdge({ label: innerLink.label })
      }
    }
  }, [isEditingLabel])

  const updateEdge = (edge: Partial<IWhiteboardEdge>) => {
    instance.updateEdge?.(id, e => ({ ...e, ...edge }))
  }

  useEffect(() => {
    drawPath()
  }, [sourceId, sourcePosition, targetPosition, targetId, realLineType])

  return (
    <g
      onClick={clickHandler}
      onPointerDown={handlePointerDown}
      style={{
        pointerEvents: 'none',
        cursor: isErasing ? 'crosshair' : 'pointer',
        opacity: isTouched ? 0.3 : currentHighlight ? (currentHighlight.edgeIds.has(edge.id) ? 1 : 0.2) : 1,
        display: isReposition && currentEdgeId === edge.id ? 'none' : 'unset'
      }}
    >
      <path
        className={lineStyle === 'animatedDash' ? animatedEdgeClazz : lineStyle === 'dash' ? dashEdgeClazz : undefined}
        pointerEvents="none"
        ref={edgeRef}
        fill="none"
        markerEnd={hideArrow ? undefined : `url(#${getMarkerId('end', Colors.getAdaptColor(edge?.color) || MarkerColor.PRIMARY)})`}
        stroke={Colors.getAdaptColor(edge?.color) || Colors.Font.Primary}
        strokeWidth={lineStyle === 'animatedDash' || lineStyle === 'dash' ? 4 : lineStyle === 'regular' ? 4 : lineStyle === 'thick' ? 6 : 2}
      ></path>
      <path
        onPointerEnter={e => {
          handlePointerEvent(e)
        }}
        ref={underEdgeRef}
        pointerEvents="auto"
        stroke={'transparent'}
        strokeWidth={'calc(20 * var(--zoom-level)'}
        fill="none"
        cursor={isErasing ? 'crosshair' : 'pointer'}
      />
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
              onBlur={() => {
                toggleIsEditingLabel(false)
              }}
              onClick={() => setTimeout(() => toggleIsEditingLabel(true))}
              style={{
                maxWidth: '16em',
                fontSize: FontSize['14px'],
                padding: '6px',
                minWidth: 1
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
  fontWeight: 500,
  cursor: 'text',
  textTransform: 'none'
})
export default TreeEdge
