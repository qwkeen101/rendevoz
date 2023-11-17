import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { Editor, Path } from 'slate'
import { CustomEditor, CustomElement, IEditorInstance } from '~/typings'

/**
 * 拖拽到折叠的主要有两种：
 * 1. 标题
 * 2. 列表
 * 都需要找到偏移的路径量
 * 如果目标并未折叠则无偏移，
 * 如果目标已折叠则加上其折叠掉的块的路径量
 */

const useToggleDrag = (instance: IEditorInstance, editor: CustomEditor) => {
  const toggleOps = instance.toggleOps
  const handleDragToToggled = (targetPath: Path): Path => {
    if (!toggleOps) return targetPath
    const targetNode = Editor.node(editor, targetPath)[0] as CustomElement
    // target node is folded
    if (toggleOps.isTogglableElement(targetNode) && targetNode.folded === true) {
      const underNodes = toggleOps.getUnderNodes(targetPath)
      if (underNodes.length) {
        return underNodes[underNodes.length - 1][1]
      }
    }
    return targetPath
  }

  return handleDragToToggled
}

export default useToggleDrag
