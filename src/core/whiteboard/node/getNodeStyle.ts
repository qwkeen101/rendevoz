import { CSSProperties } from 'react'
import { IWhiteboardNode } from '~/typings'
import { NodeInnerState } from '@/core/whiteboard/node/WrapperNode'
import Colors from '../../../consts/colors'
import { getSetting } from '@/core'

const transparentBackgroundNodes = ['text', 'freehand']
const getNodeStyle = (
  node: IWhiteboardNode,
  nodeState: NodeInnerState,
  opts: {
    displayCover?: boolean
    groupEnablePointer: boolean
    isErased?: boolean
    isErasing?: boolean
    background: {
      opacityBackground: string
      darkenSecondBackground: string
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
    return isDarkMode
      ? 'var(--box-shadow)'
      : 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15,15,15, 0.1) 0px 3px 6px, rgba(15,15,15,0.1) 0px 9px 24px'
  }
  let pointerEvents: CSSProperties['pointerEvents'] = 'auto'
  if (node.type === 'group')
    if (
      (nodeState.popoverVisible || nodeState.focused || nodeState.locked || nodeState.selected || opts.displayCover) &&
      opts?.groupEnablePointer
    ) {
      pointerEvents = 'auto'
    } else {
      pointerEvents = 'none'
    }
  if (node.type === 'freehand' || node.type === 'text') {
    if (!(nodeState.popoverVisible || nodeState.selected || nodeState.focused || nodeState.locked || opts.displayCover) && !node.background) {
      pointerEvents = 'none'
    }
  }

  return {
    boxShadow: getNodeBoxShadow(),
    opacity: opts.isErased ? 0.2 : 1,
    borderRadius: nodeState.selected ? 4 : 6,
    zIndex: node.type === 'group' ? -10000 : nodeState.expanded ? 1000 : undefined,
    background:
      node.type === 'group'
        ? opts.background.opacityBackground
        : node.background
        ? opts.background.darkenSecondBackground
        : transparentBackgroundNodes.includes(node.type)
        ? 'transparent'
        : Colors.Background.Secondary,
    cursor: opts.isErasing ? 'crosshair' : opts.displayCover ? 'pointer' : nodeState.focused || nodeState.locked ? 'auto' : 'grab',
    pointerEvents
  }
}

export default getNodeStyle
