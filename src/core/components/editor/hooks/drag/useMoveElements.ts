import { CustomEditor, CustomElement, IEditorInstance } from '~/typings'
import moveMultiElements from '@/core/components/editor/utils/moveMultiElements'
import { Path } from 'slate'
import { ID_TO_PATH_MAP } from '@/core'

const useMoveElements = (instance: IEditorInstance, editor: CustomEditor) => {
  const toggleOps = instance.toggleOps
  const moveElements = (elements: CustomElement[]) => {
    const indicator = instance.values.indicator
    console.log(indicator)
    if (!indicator) return
    const { direction, isNested, element, path } = indicator
    if (direction === 'bottom') {
      let finalPath = path
      if (toggleOps?.isTogglableElement(element)) {
        finalPath = toggleOps.getFoldedOffsetPath(path)
      }
      const targetLevel = element.level || 0
      const firstLevel = elements[0].level || 0
      let nextLevel = undefined
      if (isNested) {
        const delta = targetLevel + 1 - firstLevel
        nextLevel = curr => {
          return curr + delta
        }
      } else {
        const delta = targetLevel - firstLevel
        nextLevel = curr => curr + delta
      }
      moveMultiElements({
        editor,
        direction,
        targetPath: finalPath,
        nextLevel,
        currNodes: elements.map(i => [i, getElementPath(i)])
      })
      return
    }
    moveMultiElements({
      editor,
      direction,
      targetPath: path,
      currNodes: elements.map(i => [i, getElementPath(i)])
    })
  }
  const getElementPath = (element: CustomElement): Path => {
    if (!element.id) {
      throw new Error("Can't find element's id")
    }
    const path = ID_TO_PATH_MAP.get(editor)?.get(element.id)
    if (!path) throw new Error("Can't find element's path")
    return path
  }
  return moveElements
}

export default useMoveElements
