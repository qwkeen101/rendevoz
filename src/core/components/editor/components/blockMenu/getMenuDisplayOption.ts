import { CustomEditor, CustomElement, IEditorInstance } from '~/typings'
import { EditorBlockDisplayOptions } from '@/core/components/editor/components/blockMenu/EditorBlockMenu'
import EditorSettings from '@/core/components/editor/consts/settings'

export default (editor: CustomEditor, instance: IEditorInstance): Set<EditorBlockDisplayOptions> => {
  const selected = instance.getSelectedElements?.()
  const optionSet = new Set<EditorBlockDisplayOptions>(['background', 'duplicate', 'copy link', 'delete', 'copy link to all', 'turnInto'])
  const allSelectedTypes = new Set<CustomElement['type']>(selected?.map(i => i.type))
  const selectedTypeArr = Array.from(allSelectedTypes.values())
  selectedTypeArr.forEach(t => {
    if (EditorSettings.NoBackgroundTypes.has(t)) {
      optionSet.delete('background')
    }
    if (EditorSettings.NoTurnIntoTypes.has(t)) {
      optionSet.delete('turnInto')
    }
  })
  if (selected?.length === 1 && allSelectedTypes.has('iframe')) {
    optionSet.add('copy link to original')
  }
  if (selected?.length && selected.length > 1) {
    optionSet.delete('copy link')
  } else {
    optionSet.delete('copy link to all')
  }
  return optionSet
}
