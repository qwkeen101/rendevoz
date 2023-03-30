import { Content } from '@/components/base'
import { DraggableElement } from '@/core'
import { useToggle } from '@/hooks'
import useClickOutside from '@/hooks/utils/useClickOutside'
import { useGlobalAtomValue } from '@/hooks/jotai'
import { PageSize } from '~/typings'
import { LabelStore } from '@/stores'
import { labelsAtom } from '@/stores/label.store'
import { css } from '@emotion/css'
import { selectAtom } from 'jotai/utils'
import { Fragment, memo, ReactElement, useLayoutEffect, useMemo, useState, useRef } from 'react'
import { Rnd } from 'react-rnd'
import { IShapeLabel } from '~/typings/data'

const shapeClassName = css({
  width: '100%',
  height: '100%'
})
const getShapeDetails = (
  shape: IShapeLabel['shape'],
  options: {
    onClick: React.MouseEventHandler
    pageSize: PageSize
  }
) => {
  const { pageSize } = options
  let defaultSize: {
    width: number | string
    height: number | string
  } = {
    width: pageSize.width * 0.3,
    height: pageSize.width * 0.3
  }
  let renderShape: () => ReactElement = () => <Fragment />
  switch (shape) {
    case 'rectangle': {
      renderShape = () => (
        <svg className={shapeClassName}>
          <rect onClick={options?.onClick} cursor="pointer" pointerEvents="auto" stroke="black" fill="none" width="100%" height="100%" />
        </svg>
      )
      defaultSize = {
        width: pageSize.width * 0.4,
        height: pageSize.width * 0.4 * 0.66
      }
      break
    }
    case 'square': {
      renderShape = () => (
        <svg className={shapeClassName}>
          <rect onClick={options?.onClick} cursor="pointer" pointerEvents="auto" stroke="black" fill="none" width="100%" height="100%" />
        </svg>
      )
      defaultSize = {
        width: pageSize.width * 0.3,
        height: pageSize.width * 0.3
      }
      break
    }
    case 'round': {
      renderShape = () => (
        <svg className={shapeClassName}>
          <ellipse
            onClick={options?.onClick}
            cursor="pointer"
            pointerEvents="auto"
            stroke="black"
            fill="none"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
          />
        </svg>
      )
      defaultSize = {
        width: pageSize.width * 0.3,
        height: pageSize.width * 0.3
      }
      break
    }
  }
  return {
    renderShape,
    defaultSize
  }
}
const ShapeLabel = ({ labelId, pageSize, documentId }: { labelId: number; pageSize: PageSize; documentId: number }) => {
  const shapeAtom = useMemo(() => selectAtom(labelsAtom, l => l.get(labelId)), [labelId])
  const shape = useGlobalAtomValue(shapeAtom) as IShapeLabel
  const [innerPosition, setInnerPosition] = useState<{ x: number; y: number }>()
  const [top, left, percentageWidth, percentageHeight] = shape?.rect || []
  const realWidth = pageSize.width * percentageWidth
  const realHeight = pageSize.height * percentageHeight
  const [choosed, toggleChoosed] = useToggle(false)
  const { updateLabel } = LabelStore
  const [labelState, setLabelState] = useState<{
    inPdfMovable: boolean
  }>({
    inPdfMovable: false
  })
  const isResizingRef = useRef(false)
  useLayoutEffect(() => {
    const { width, height } = pageSize
    if (top && left) {
      setInnerPosition({
        x: left * width,
        y: top * height
      })
    }
  }, [pageSize, top, left])
  const rndRef = useRef<HTMLElement>()
  const { renderShape, defaultSize } = useMemo(
    () =>
      getShapeDetails(shape?.shape, {
        onClick: toggleChoosed,
        pageSize: pageSize
      }),
    []
  )
  useClickOutside(
    () => {
      if (isResizingRef.current === false) {
        toggleChoosed(false)
      }
    },
    rndRef,
    choosed
  )
  return (
    <Rnd
      ref={node => {
        rndRef.current = node?.getSelfElement()
      }}
      disableDragging={!(choosed && labelState.inPdfMovable)}
      onResizeStart={() => {
        isResizingRef.current = true
      }}
      onDragStop={(e, data) => {
        updateLabel({ id: labelId, rect: [data.y / pageSize.height, data.x / pageSize.width, percentageWidth, percentageHeight] })
      }}
      bounds="parent"
      onResizeStop={(e, dir, ele, delta, pos) => {
        const { clientWidth, clientHeight } = ele
        const percentageWidth = clientWidth / pageSize.width
        const percentageHeight = clientHeight / pageSize.height
        const percentageTop = pos.y / pageSize.height
        const percentageLeft = pos.x / pageSize.width
        updateLabel({ id: labelId, rect: [percentageTop, percentageLeft, percentageWidth, percentageHeight] })
        setTimeout(() => {
          isResizingRef.current = false
        })
      }}
      position={innerPosition}
      size={{
        width: realWidth || defaultSize.width,
        height: realHeight || defaultSize.height
      }}
      style={{ pointerEvents: choosed ? 'auto' : undefined, boxShadow: choosed ? '0px 0px 0px 1px #8590ae' : undefined }}
    >
      <DraggableElement
        draggable={!labelState.inPdfMovable}
        draggingDetails={{
          type: 'pdfElement',
          labelId,
          pdfId: documentId
        }}
      >
        <Content fullWidth fullHeight>
          {renderShape()}
        </Content>
      </DraggableElement>
    </Rnd>
  )
}

export default memo(ShapeLabel, (prev, curr) => {
  return (
    prev.labelId === curr.labelId &&
    prev.pageSize.height === curr.pageSize.height &&
    prev.pageSize.width === curr.pageSize.width &&
    prev.pageSize.scale === curr.pageSize.scale &&
    prev.dragBoundRef === curr.dragBoundRef
  )
})
