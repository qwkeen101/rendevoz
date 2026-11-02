import { CustomEditor, IEditorInstance } from '~/typings'
import { assignProperties } from '../utils'

export default (instance: IEditorInstance, _editor: CustomEditor) => {
  assignProperties(instance, { aiOps: undefined })
}
