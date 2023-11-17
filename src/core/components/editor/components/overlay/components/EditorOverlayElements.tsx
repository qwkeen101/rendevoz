import { WithBorder } from '@/components/base'
import { CustomEditor } from '~/typings'
import EditorElementsMenu, { EditorSlashElementsMenu } from '@/core/components/editor/components/EditorElementsMenu'
import { EditorOverlayManager } from '../useEditorOverlay'
import { defaultHandler } from '../../handleAddElementInMenu'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { EditorTypeToElementMap } from '@/core/components/editor/maps'

const EditorOverlayElements = ({
  editor,
  manager,
  mode
}: {
  editor: CustomEditor
  manager: EditorOverlayManager
  mode: 'block' | 'slash'
}) => {
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
    <>
      <WithBorder>
        {mode === 'block' ? (
          <EditorElementsMenu onAddElement={handleElementAdd} />
        ) : (
          <EditorSlashElementsMenu onAddElement={handleElementAdd} />
        )}
      </WithBorder>
    </>
  )
}

export default EditorOverlayElements
