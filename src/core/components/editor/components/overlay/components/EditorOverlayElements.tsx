import { WithBorder } from '@/components/base'
import { CustomEditor } from '~/typings'
import EditorElementsMenu from '@/core/components/editor/components/EditorElementsMenu'
import { EditorOverlayManager } from '../useEditorOverlay'
import { defaultHandler } from '../../handleAddElementInMenu'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { EditorTypeToElementMap } from '@/core/components/editor/maps'

const EditorOverlayElements = ({ editor, mode }: { editor: CustomEditor; mode: 'block' | 'slash' }) => {
  const instance = useEditorInstance()

  const handleElementAdd = (type: string) => {
    const registered = EditorTypeToElementMap.get(type)
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
