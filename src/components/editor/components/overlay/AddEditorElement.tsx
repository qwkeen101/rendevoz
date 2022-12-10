import { WithBorder } from '@/components/base'
import EditorElementsMenu from '@/components/menus/EditorElementsMenu'

const AddEditorElement = () => {
  const handleAddElement = (elementName: string) => {

  }
  return (
    <WithBorder>
      <EditorElementsMenu onAddElement={handleAddElement}/>
    </WithBorder>
  )
}
