import { CSSProperties } from 'react'
import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import { NodeInnerState } from '@/core/components/whiteboard/node/WrapperNode'
import Colors from '@/consts/colors'
import tinycolor from 'tinycolor2'

const colorToDarken: Record<string, string> = {}
const transparentBackgroundNodes = ['text', 'freehand']
const getNodeStyle = (
  node: IWhiteboardNode,
  nodeState: NodeInnerState,
  instance: IWhiteboardInstance,
  opts: {
    displayCover?: boolean
    groupEnablePointer: boolean
    isErased?: boolean
    isErasing?: boolean
    panPointerMode?: boolean
    enableClickWhenPanning?: boolean
    background: {
      opacityBackground: string
    }
  }
): CSSProperties => {
  let mindmapTransparent = false
  if (node.type === 'mindmap') {
    if (!node.nodeType || transparentBackgroundNodes.includes(node.nodeType)) {
      mindmapTransparent = true
    }
  }
  const getNodeBoxShadow = () => {
    if (nodeState.selected || nodeState.popoverVisible || nodeState.focused || nodeState.locked) {
      return `0 0 0 calc(2px * var(--zoom-level)) var(--select-color)`
    }
    if ((node.rootId || node.type === 'mindmap') && node.borderType === 'underline') return undefined
    if (transparentBackgroundNodes.includes(node.type) || showBorder) {
      return undefined
    }
    if (mindmapTransparent) return undefined
    return '0 0 0 calc(1px * var(--zoom-level)) var(--border-background)'
  }
  let pointerEvents: CSSProperties['pointerEvents'] = 'auto'
  if (node.type === 'freehand') {
    if (
      !(nodeState.popoverVisible || nodeState.selected || nodeState.focused || nodeState.locked || opts.displayCover) &&
      !node.background
    ) {
      pointerEvents = 'none'
    }
  }
  if (opts.panPointerMode && opts.enableClickWhenPanning !== true) {
    pointerEvents = 'none'
  }

  let cursor: CSSProperties['cursor'] = 'auto'

  if (opts.displayCover) {
    cursor = 'pointer'
  }
  if (node.type === 'group') {
    if (!nodeState.selected && !nodeState.focused) {
      if (!node.name) {
        cursor = 'pointer'
      } else {
        cursor = 'auto'
      }
    } else {
      cursor = 'grab'
    }
  } else {
    if (nodeState.focused || nodeState.locked) {
      cursor = 'auto'
    } else {
      cursor = 'grab'
    }
  }
  if (opts.isErasing) {
    cursor = 'crosshair'
  }
  if (opts.panPointerMode && opts.enableClickWhenPanning === true) {
    cursor = 'pointer'
  }
  let zIndex: number | undefined = node.z
  if (nodeState.expanded) {
    zIndex = 1000 + (node.z ?? 0)
  }
  if (node.type === 'group') {
    zIndex = -10000
    const parentGroups = instance.groupOps?.getParentGroupsOfNode(node.id) ?? []
    zIndex += parentGroups?.length
  }
  let borderRadius = 4
  switch (node.borderType) {
    case 'rect':
      borderRadius = 0
      break
    case 'round':
      borderRadius = 20
      break
    case 'roundRect':
      borderRadius = 8
      break
  }

  let showBorder = true
  if (node.type === 'group' || node.borderType === 'underline' || !node.border) {
    showBorder = false
  }
  let opacity = 1
  if (opts.isErased) {
    opacity = 0.2
  }
  if (node.rootId && node.x === 0 && node.y === 0 && !node.height) {
    opacity = 0
  }
  let borderColor = ''
  if (showBorder && node.border) {
    let c = colorToDarken[node.border]
    if (!c) {
      c = tinycolor(node.border).darken(30).toHexString()
      colorToDarken[node.border] = c
    }
    borderColor = c
  }
  return {
    boxShadow: getNodeBoxShadow(),
    opacity,
    borderRadius: borderRadius,
    zIndex,
    border: showBorder ? `3px solid ${borderColor}` : undefined,
    userSelect: nodeState.focused || nodeState.focused ? 'auto' : 'none',
    background:
      node.type === 'group'
        ? opts.background.opacityBackground
        : node.background
        ? Colors.getAdaptColor(node.background)
        : transparentBackgroundNodes.includes(node.type) || mindmapTransparent
        ? 'transparent'
        : Colors.Background.Secondary,
    cursor,
    pointerEvents
  }
}

export default getNodeStyle
