import createMetaStore, { metaLinksAtom } from '@/stores/meta.store'
import { globalStore, MetaStore } from '@/stores'
import { useAtomValue } from 'jotai/react'
import { FC, memo, useEffect, useRef, useState, MouseEventHandler, useLayoutEffect, useMemo } from 'react'
import { IWhiteboardEdge } from '../../../typings/data/whiteboard'
import { useFlow, useSetWhiteboardEdges } from './hooks'
import { getBezierPath, getEdgeData, transformXY } from './utils'
import { isEqual } from 'lodash'
import { getMarkerId } from '../graph/utils/getMarkerId'
import { MarkerColor } from '../svg/markerColors'
import { motion } from 'framer-motion'
import { Position } from '@/types'
import { AnimatePopover, Icon, IconWithPopover, WithBorder } from '..'
import Zindexes from '@/consts/zindex'
import BorderInput from '../base/BorderInput'
import { useDebounceFn } from '@/hooks'
import BlockColorPicker from '../editor/components/BlockColorPicker'
import { defaultBgColor } from '../picker/colorPicker'
import { MetaLink } from '~/typings/data'
import ClassName from '@/styles/classNames'
import produce from 'immer'
import { createPortal } from 'react-dom'
import { getSvgFilter } from '../svg/Filter'
import { hexToRgb } from '@/utils/color'
const TreeEdge: FC<{
  edge: IWhiteboardEdge
}> = memo(({ edge }) => {
  const { id, sourceId, targetId, targetPosition = 'left', sourcePosition = 'right', metaLinkId } = edge
  const link = useAtomValue(metaLinksAtom, { store: globalStore }).get(metaLinkId || 0)
  const [innerLink, setInnerLink] = useState<Partial<MetaLink>>()
  useEffect(() => {
    link && setInnerLink(link)
  }, [link])

  const labelRef = useRef<SVGTextElement>(null)
  const labelContainerRef = useRef<SVGGElement>(null)
  const [labelSize, setLabelSize] = useState<{
    width: number
    height: number
  }>()
  const flow = useFlow()

  const edgeRef = useRef<SVGPathElement>(null)

  const { updateMetaLink } = MetaStore

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
  const { run: debouncedUpdate } = useDebounceFn(updateMetaLink, { wait: 1000 })
  const rgb = useMemo(() => hexToRgb(innerLink?.color || MarkerColor.NORMAL), [innerLink?.color])
  useLayoutEffect(() => {
    if (innerLink?.label && flow && labelRef.current) {
      const bound = labelRef.current?.getBoundingClientRect()
      const realWidth = bound.width / flow.containerTransformScale
      const realHeight = bound.height / flow.containerTransformScale
      setLabelSize({
        width: realWidth,
        height: realHeight
      })
      drawPath()
    }
  }, [innerLink?.label])

  const [isIn, setIsIn] = useState(false)
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
              <IconWithPopover
                tooltip="Change Edge Label"
                tooltipPosition="top"
                className={ClassName.circleButton(undefined, 4)}
                size={18}
                padding={10}
                content={
                  <BorderInput
                    style={{ height: 40, minWidth: 200, maxWidth: 400, background: 'white' }}
                    onChange={v => {
                      debouncedUpdate({
                        id,
                        label: v
                      })
                      setInnerLink({
                        ...innerLink,
                        label: v
                      })
                    }}
                    defaultValue={innerLink?.label}
                  />
                }
                name="park-edit"
              ></IconWithPopover>
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
                      debouncedUpdate({
                        id,
                        color: c === defaultBgColor ? undefined : c
                      })
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
        onPointerEnter={() => setIsIn(true)}
        onPointerLeave={() => setIsIn(false)}
        style={{
          pointerEvents: 'auto',
          cursor: 'pointer'
        }}
        onClick={clickHandler}
      >
        {isIn && (
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            stroke={`rgba(${rgb?.r},${rgb?.g},${rgb?.b},0.2)`}
            strokeWidth={'calc(16 * var(--zoom-level)'}
            fill="none"
            d={pathRef.current}
          />
        )}
        <motion.path
          ref={edgeRef}
          fill="none"
          markerEnd={`url(#${getMarkerId('end', innerLink?.color || MarkerColor.NORMAL)})`}
          stroke={innerLink?.color || MarkerColor.NORMAL}
          strokeWidth={'calc(2 * var(--zoom-level))'}
          animate={{
            strokeWidth: isIn ? 'calc(4 * var(--zoom-level)' : 'calc(2 * var(--zoom-level))'
          }}
        ></motion.path>
        {innerLink?.label && (
          <g ref={labelContainerRef}>
            {labelSize && (
              <rect
                fill="rgba(255,255,255)"
                width={labelSize?.width + 10}
                height={labelSize?.height + 6}
                x={-(labelSize?.width + 10) / 2}
                y={-(labelSize?.height + 6) / 2}
                stroke={innerLink.color || MarkerColor.NORMAL}
                rx={3}
                strokeWidth={2}
              ></rect>
            )}
            <text
              style={{
                userSelect: 'none',
                fontSize: '16px'
              }}
              fontFamily="Muli"
              fontWeight={600}
              ref={labelRef}
              fill={innerLink.color || MarkerColor.NORMAL}
              x={-(labelSize?.width || 0) / 2}
              y={(labelSize?.height || 0) / 4}
            >
              {innerLink.label}
            </text>
          </g>
        )}
      </g>
    </>
  )
})

export default TreeEdge
