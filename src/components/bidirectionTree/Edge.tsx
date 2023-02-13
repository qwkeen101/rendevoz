import useMetaStore, { metaLinksAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores/stores'
import { useAtomValue } from 'jotai/react'
import { FC, memo, useEffect, useRef, useState, PointerEventHandler, MouseEventHandler, useLayoutEffect } from 'react'
import { ITreeEdge } from './types'
import { useFlow } from './hooks'
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
const TreeEdge: FC<ITreeEdge> = memo(({ id, sourceId, targetId }) => {
  const link = useAtomValue(metaLinksAtom, { store: globalStore }).get(id)
  const [innerLink, setInnerLink] = useState<Partial<MetaLink>>()
  useEffect(() => {
    link && setInnerLink(link)
  }, [link])
  const [path, setPath] = useState<string>()
  const [labelPosition, setLabelPosition] = useState<Position>()
  const labelRef = useRef<SVGTextElement>(null)
  const [labelSize, setLabelSize] = useState<{
    width: number
    height: number
  }>()
  const flow = useFlow()
  const edgeRef = useRef<SVGPathElement>(null)
  const previousPositionData = useRef<ReturnType<typeof getEdgeData>>()
  const { updateMetaLink } = useMetaStore()
  const [popoverState, setPopoverState] = useState<
    Partial<{
      visible: boolean
    }>
  >({
    visible: false
  })
  const drawPath = () => {
    if (!flow) return
    const container = flow?.containerEle
    const edgeData = getEdgeData(sourceId, targetId, flow)
    const previousData = previousPositionData.current
    previousPositionData.current = edgeData
    if (isEqual(edgeData, previousData)) {
      return
    }
    if (edgeData && container) {
      const { sourceX, sourceY, targetX, targetY } = edgeData
      const containerBound = container.getBoundingClientRect()
      const { x: TSX, y: TSY } = transformXY(containerBound, sourceX, sourceY, flow.containerTransformScale)
      const { x: TTX, y: TTY } = transformXY(containerBound, targetX, targetY, flow.containerTransformScale)
      const path = getBezierPath({
        sourceX: TSX,
        sourceY: TSY,
        targetX: TTX,
        targetY: TTY,
        sourcePosition: 'right',
        targetPosition: 'left'
      })[0]
      setPath(path)
      setLabelPosition({
        left: (TSX + TTX) / 2,
        top: (TSY + TTY) / 2
      })
    }
  }
  flow?.ID_TO_EDGE_MAP.set(id, {
    drawPath,
    element: edgeRef.current
  })
  useEffect(() => {
    if (!path) {
      drawPath()
    }
  }, [])
  const clickHandler: MouseEventHandler = e => {
    setPopoverState(s => ({
      visible: !s.visible
    }))
  }
  const { run: debouncedUpdate } = useDebounceFn(updateMetaLink, { wait: 1000 })

  useLayoutEffect(() => {
    if (innerLink?.label && flow && labelRef.current) {
      const bound = labelRef.current?.getBoundingClientRect()
      const realWidth = bound.width / flow.containerTransformScale
      const realHeight = bound.height / flow.containerTransformScale
      setLabelSize({
        width: realWidth,
        height: realHeight
      })
    }
  }, [innerLink?.label])

  const [isIn, setIsIn] = useState(false)
  return (
    <>
      <AnimatePopover
        visible={!!popoverState.visible}
        onClickOutside={() => setPopoverState({ visible: false })}
        positions={['top', 'bottom']}
        content={
          <WithBorder style={{ display: 'flex', gap: 6, padding: '2px 6px' }}>
            <IconWithPopover
              className={ClassName.circleButton(undefined, 4)}
              size={18}
              padding={10}
              content={
                <BorderInput
                  style={{ height: 40, minWidth: 200, maxWidth: 400 }}
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
          </WithBorder>
        }
        disableIntersection
        containerStyle={{
          zIndex: String(Zindexes.Tooltip)
        }}
      >
        <g
          onPointerEnter={() => setIsIn(true)}
          onPointerLeave={() => setIsIn(false)}
          style={{
            pointerEvents: 'auto',
            cursor: 'pointer'
          }}
          onClick={clickHandler}
        >
          <motion.path
            fill="none"
            markerEnd={`url(#${getMarkerId('end', innerLink?.color || MarkerColor.NORMAL)})`}
            stroke={innerLink?.color || MarkerColor.NORMAL}
            d={path}
            strokeWidth={2}
            animate={{
              strokeWidth: isIn ? 4 : 2
            }}
          ></motion.path>
          {innerLink?.label && (
            <g transform={`translate(${labelPosition?.left} ${labelPosition?.top})`}>
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
                  userSelect: 'none'
                }}
                fontSize={18}
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
      </AnimatePopover>
    </>
  )
})

export default TreeEdge
