import { WithBorder } from '@/components/base'
import { CustomEditor, CustomElement } from '~/typings'
import EditorElementsMenu from '@/core/components/editor/components/EditorElementsMenu'
import { defaultHandler } from '../../handleAddElementInMenu'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import EditorElements from '@/core/components/editor/elements/EditorElements'

const EditorOverlayElements = ({ editor, mode }: { editor: CustomEditor; mode: 'block' | 'slash' }) => {
  const instance = useEditorInstance()

  const handleElementAdd = (type: CustomElement['type']) => {
    const registered = EditorElements[type]
    if (registered) {
      if (registered.registerInMenu?.onAddInMenu) {
        registered.registerInMenu.onAddInMenu({
          editor,
          type,
          defaultAddHandler: defaultHandler
        })
        return
      }
    }

    defaultHandler(type, instance, mode)
  }
  return (
    <WithBorder>
      <EditorElementsMenu onAddElement={handleElementAdd} />
    </WithBorder>
  )
}

export default EditorOverlayElements
