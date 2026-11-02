import { IEditorInstance } from '~/typings'
import { Editor, Path } from 'slate'

export default (instance: IEditorInstance, currIndicator: Required<IEditorInstance['values']>['indicator']) => {
  const prevIndicator = instance.values.indicator
  const editor = instance.getSlateEditor?.()
  if (!editor) return
  // if (prevIndicator) {
  //   const prevElement = prevIndicator.element
  //   const prevElementPath = instance.getElementPathById?.(prevElement.id)
  //   if (prevElementPath) {
  //     if (Path.isSibling(prevElementPath, currIndicator.path)) {
  //       if(Path.isBefore(prevElementPath, currIndicator.path)){
  //         if(prevIndicator.direction === 'top' && currIndicator.direction === 'bottom'){
  //
  //         }
  //       }
  //     }
  //   }
  // }
  if (currIndicator.direction === 'top') {
    if (Path.hasPrevious(currIndicator.path)) {
      const prev = Path.previous(currIndicator.path)
      const prevElement = Editor.node(editor, prev)[0]
    }
  }
  return currIndicator
}
