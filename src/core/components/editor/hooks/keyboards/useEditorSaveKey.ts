import isHotkey from 'is-hotkey'
import { IEditorInstance } from '~/typings'

const useEditorSaveKey = (instance: IEditorInstance) => {
  const handleSaveKey = (e: KeyboardEvent) => {
    if (isHotkey('mod+s', e)) {
      instance.save?.()
    }
  }
  return handleSaveKey
}

export default useEditorSaveKey
