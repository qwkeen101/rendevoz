import React, { useRef, useState } from 'react'
import { DragDropDiv } from './dragdrop/DragDropDiv'
import { DragState } from './dragdrop/DragManager'
import { disableWebviewPointer } from '../ResizeAndDrag'
import { Colors } from '@/consts'

export interface DividerChild {
  size: number
  minSize?: number
}

export interface DividerData {
  element: HTMLElement
  beforeDivider: DividerChild[]
  afterDivider: DividerChild[]
}

interface DividerProps {
  idx: number
  className?: string
  isVertical?: boolean

  getDividerData(idx: number): DividerData

  changeSizes(sizes: number[]): void

  onDragEnd?(): void
}

class BoxDataCache implements DividerData {
  element: HTMLElement
  beforeDivider: DividerChild[]
  afterDivider: DividerChild[]

  beforeSize = 0
  beforeMinSize = 0
  afterSize = 0
  afterMinSize = 0

  constructor(data: DividerData) {
    this.element = data.element
    this.beforeDivider = data.beforeDivider
    this.afterDivider = data.afterDivider
    for (const child of this.beforeDivider) {
      this.beforeSize += child.size
      if (child.minSize > 0) {
        this.beforeMinSize += child.minSize
      }
    }
    for (const child of this.afterDivider) {
      this.afterSize += child.size
      if (child.minSize > 0) {
        this.afterMinSize += child.minSize
      }
    }
  }
}

// split size among children
function spiltSize(newSize: number, oldSize: number, children: DividerChild[]): number[] {
  let reservedSize = -1
  const sizes: number[] = []
  let requiredMinSize = 0
  while (requiredMinSize !== reservedSize) {
    reservedSize = requiredMinSize
    requiredMinSize = 0
    const ratio = (newSize - reservedSize) / (oldSize - reservedSize)
    if (!(ratio >= 0)) {
      // invalid input
      break
    }
    for (let i = 0; i < children.length; ++i) {
      let size = children[i].size * ratio
      if (size < children[i].minSize) {
        size = children[i].minSize
        requiredMinSize += size
      }
      sizes[i] = size
    }
  }
  return sizes
}

export default (props: DividerProps) => {
  const boxData = useRef<BoxDataCache>()
  const [isDrag, setIsDrag] = useState(false)
  const startDrag = (e: DragState) => {
    setIsDrag(true)
    document.body.style.cursor = !props.isVertical ? 'ew-resize' : 'ns-resize'
    boxData.current = new BoxDataCache(props.getDividerData(props.idx))
    e.startDrag(boxData.current.element, null)
    document.body.classList.add(disableWebviewPointer)
  }
  const dragMove = (e: DragState) => {
    if (e.event.shiftKey || e.event.ctrlKey || e.event.altKey) {
      dragMoveAll(e, e.dx, e.dy)
    } else {
      dragMove2(e, e.dx, e.dy)
    }
  }

  function dragMove2(e: DragState, dx: number, dy: number) {
    if (!boxData.current) return
    const { isVertical, changeSizes } = props
    const { beforeDivider, afterDivider } = boxData.current
    if (!(beforeDivider.length && afterDivider.length)) {
      // invalid input
      return
    }
    const d = isVertical ? dy : dx
    const leftChild = beforeDivider[beforeDivider.length - 1]
    const rightCild = afterDivider[0]

    let leftSize = leftChild.size + d
    let rightSize = rightCild.size - d
    // check min size
    if (d > 0) {
      if (rightSize < rightCild.minSize) {
        rightSize = rightCild.minSize
        leftSize = leftChild.size + rightCild.size - rightSize
      }
    } else if (leftSize < leftChild.minSize) {
      leftSize = leftChild.minSize
      rightSize = leftChild.size + rightCild.size - leftSize
    }
    const sizes = beforeDivider.concat(afterDivider).map(child => child.size)
    sizes[beforeDivider.length - 1] = leftSize
    sizes[beforeDivider.length] = rightSize
    changeSizes(sizes)
  }

  function dragMoveAll(e: DragState, dx: number, dy: number) {
    if (!boxData.current) return
    const { isVertical, changeSizes } = props
    const { beforeSize, beforeMinSize, afterSize, afterMinSize, beforeDivider, afterDivider } = boxData.current
    const d = isVertical ? dy : dx
    let newBeforeSize = beforeSize + d
    let newAfterSize = afterSize - d
    // check total min size
    if (d > 0) {
      if (newAfterSize < afterMinSize) {
        newAfterSize = afterMinSize
        newBeforeSize = beforeSize + afterSize - afterMinSize
      }
    } else if (newBeforeSize < beforeMinSize) {
      newBeforeSize = beforeMinSize
      newAfterSize = beforeSize + afterSize - beforeMinSize
    }

    changeSizes(spiltSize(newBeforeSize, beforeSize, beforeDivider).concat(spiltSize(newAfterSize, afterSize, afterDivider)))
  }

  const dragEnd = (e: DragState) => {
    setIsDrag(false)
    const { onDragEnd } = props
    boxData.current = undefined
    document.body.style.removeProperty('cursor')
    document.body.classList.remove(disableWebviewPointer)
    if (onDragEnd) {
      onDragEnd()
    }
  }

  let { className } = props
  if (!className) {
    className = 'dock-divider'
  }
  return (
    <DragDropDiv
      className={className}
      onDragStartT={startDrag}
      onDragMoveT={dragMove}
      onDragEndT={dragEnd}
      style={{
        background: isDrag ? Colors.Common.SelectColor : undefined
      }}
    />
  )
}
