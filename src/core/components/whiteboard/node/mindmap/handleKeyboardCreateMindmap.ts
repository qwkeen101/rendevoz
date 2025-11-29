/*
  Shortcuts:
  1. Enter: Create under
  2. Cmd+Enter: Create right
  3. Shift+Enter: Create above
 */
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import isHotkey from 'is-hotkey'
import { getParentNodeOfNode } from '@/core/components/whiteboard/node/mindmap/utils/tree'
import addSubNode from '@/core/components/whiteboard/node/mindmap/utils/addSubNode'

export default () => {
  const instance = useWhiteboardInstance()
  const handleKeyboardNavigation = (e: KeyboardEvent) => {
    if (isHotkey('enter', e) || isHotkey('mod+enter', e) || isHotkey('shift+enter', e)) {
      const currentSelected = instance.selectOps?.getSelectedNodes?.()
      if (currentSelected?.length === 1) {
        const node = currentSelected[0]
        if (node.type === 'mindmap' || node.rootId) {
          if (isHotkey('enter', e)) {
            addSubNode(node, 'bottom', instance)
          }
          if (isHotkey('mod+enter', e)) {
            addSubNode(node, 'right', instance)
          }
          if (isHotkey('shift+enter', e)) {
            addSubNode(node, 'top', instance)
          }
        }
      }
    }
  }
}
