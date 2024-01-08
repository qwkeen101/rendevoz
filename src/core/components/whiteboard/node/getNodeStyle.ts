import { CSSProperties } from 'react'
import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import { NodeInnerState } from '@/core/components/whiteboard/node/WrapperNode'
import Colors from '../../../../consts/colors'
import { getSetting } from '@/core'

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
    background: {
      opacityBackground: string
    }
  }
): CSSProperties => {
  const isDarkMode = getSetting().general.darkMode
  const getNodeBoxShadow = () => {
    if (nodeState.selected || nodeState.popoverVisible || nodeState.focused || nodeState.locked) {
      return `0 0 0 calc(2px * var(--zoom-level)) #279EFF`
    }
    if (transparentBackgroundNodes.includes(node.type)) {
      return undefined
    }
    if (!isDarkMode) {
      return 'var(--border-box-shadow)'
    }
    return undefined
  }
  let pointerEvents: CSSProperties['pointerEvents'] = 'auto'
  if (node.type === 'freehand' || node.type === 'text') {
    if (
      !(nodeState.popoverVisible || nodeState.selected || nodeState.focused || nodeState.locked || opts.displayCover) &&
      !node.background
    ) {
      pointerEvents = 'none'
    }
  }
  if (opts.panPointerMode) {
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
  let zIndex: number | undefined = node.z
  if (nodeState.expanded) {
    zIndex = 1000 + (node.z ?? 0)
  }
  if (node.type === 'group') {
    zIndex = -10000
    const parentGroups = instance.groupOps?.getParentGroupsOfNode(node.id) ?? []
    zIndex += parentGroups?.length
  }
  return {
    boxShadow: getNodeBoxShadow(),
    opacity: opts.isErased ? 0.2 : 1,
    borderRadius: nodeState.selected ? 4 : 6,
    zIndex,
    userSelect: nodeState.focused || nodeState.focused ? 'auto' : 'none',
    background:
      node.type === 'group'
        ? opts.background.opacityBackground
        : node.background
        ? Colors.getAdaptColor(node.background)
        : transparentBackgroundNodes.includes(node.type)
        ? 'transparent'
        : isDarkMode
        ? Colors.Background.Secondary
        : 'white',
    cursor,
    pointerEvents
  }
}

export default getNodeStyle
