import { IWhiteboardInstance } from '~/typings'
import isHotkey from 'is-hotkey'
import { mousePos } from '@/hooks/utils/useMousePositionRef'

export default (e: KeyboardEvent, instance: IWhiteboardInstance) => {
  if (isHotkey('mod+v', e)) {
    if (e.target instanceof HTMLElement && e.target.closest('input,textarea,[contenteditable="true"]')) return
    const pos = {
      x: mousePos.current[0],
      y: mousePos.current[1]
    }
    const ele = document.elementFromPoint(pos.x, pos.y)
    if (instance.getOutestContainerNode?.()?.contains(ele)) {
      instance.nodeOps?.paste(pos)
    }
  }
}
