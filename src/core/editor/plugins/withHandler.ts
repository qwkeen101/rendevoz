import { CustomEditor } from '../../../../typings/editor/types'

const withHandler = (editor: CustomEditor, handler: any) => {
  editor.handler = handler
  return editor
}

export default withHandler
