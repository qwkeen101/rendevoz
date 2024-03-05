import { CustomElement } from '~/typings'

const EditorSettings = {
  ReadOnlyTypes: new Set<CustomElement['type']>(['inline-metaObject', 'emoji', 'math', 'image']),
  NoBackgroundTypes: new Set<CustomElement['type']>(['table', 'iframe', 'synced', 'metaObject', 'image']),
  NoTurnIntoTypes: new Set<CustomElement['type']>(['table', 'iframe', 'synced', 'metaObject', 'image', 'math-block'])
}
export default EditorSettings
