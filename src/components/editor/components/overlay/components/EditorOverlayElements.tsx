import { WithBorder } from '@/components/base'
import { BasicElements, BlockElements, InlineElements, MediaElements } from '@/components/editor/consts/elements'
import { CustomEditor } from '@/components/editor/types'
import EditorElementsMenu from '@/components/menu/EditorElementsMenu'
import Id from '@/utils/id'
import { saveImageLocally } from '@/utils/img'
import { ChangeEventHandler, useRef } from 'react'
import { Editor, Path, Range, Transforms } from 'slate'
import { ReactEditor } from '../../../slate-react'
import { EditorOverlayManager } from '../useEditorOverlay'

const EditorOverlayElements = ({ editor, manager }: { editor: CustomEditor; manager: EditorOverlayManager }) => {
  const handleUploadFile: ChangeEventHandler<HTMLInputElement> = e => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image')) {
        saveImageLocally(Id.getStrId(), file).then(data => {
          manager.close()
          Editor.insertNode(editor, {
            type: 'image',
            url: data.data,
            children: [{ text: '' }]
          })
        })
      }
    }
  }
  const handleAddElement = (elementName: string) => {
    const { currentAddClickElement } = editor
    let addElementPath: Path = []
    let isCurrentElementEmpty = false
    if (currentAddClickElement) {
      addElementPath = ReactEditor.findPath(editor, currentAddClickElement)
      addElementPath = Path.next(addElementPath)
      isCurrentElementEmpty = Editor.isEmpty(editor, currentAddClickElement)
      if (isCurrentElementEmpty) {
        addElementPath = Path.previous(addElementPath)
      }
    }
    if (isCurrentElementEmpty) {
      Transforms.removeNodes(editor, { at: addElementPath })
    }

    if (Object.values(BasicElements).some(i => i === elementName) || Object.values(BlockElements).some(i => i === elementName)) {
      Transforms.insertNodes(
        editor,
        {
          id: Id.getId(),
          type: elementName,
          children: [{ text: '' }]
        },
        {
          at: addElementPath
        }
      )
      Transforms.select(editor, addElementPath)
      ReactEditor.focus(editor)
      manager.close()
      return
    }
    if (Object.values(InlineElements).some(i => i === elementName)) {
      manager.close()
      switch (elementName) {
        case InlineElements.MetaObject: {
          const { selection } = editor
          if (!selection) return
          Transforms.insertNodes(
            editor,
            {
              id: Id.getId(),
              type: BasicElements.Paragraph,
              children: [{ text: '$ ' }]
            },
            {
              at: addElementPath
            }
          )
          Transforms.setSelection(editor, Editor.range(editor, addElementPath, Editor.end(editor, addElementPath)))
          setTimeout(() => {
            manager.setContent('metaQuery')
            manager.open()
          }, 50)
          return
        }
        case InlineElements.Emoji: {
          Transforms.insertNodes(
            editor,
            {
              id: Id.getId(),
              type: BasicElements.Paragraph,
              children: [{ text: '' }]
            },
            {
              at: addElementPath
            }
          )
          Transforms.setSelection(editor, Editor.range(editor, addElementPath, Editor.end(editor, addElementPath)))
          setTimeout(() => {
            manager.setContent('emojiPicker')
            manager.open()
          }, 50)
          return
        }
      }
    }
    if (Object.values(MediaElements).some(i => i === elementName)) {
      fileUploaderRef.current?.click()
    }
  }
  const fileUploaderRef = useRef<HTMLLabelElement>(null)
  return (
    <>
      <WithBorder>
        <EditorElementsMenu onAddElement={handleAddElement} />
      </WithBorder>
      <input type="file" name={`file_${editor.id}`} id={`file_${editor.id}`} style={{ display: 'none' }} onChange={handleUploadFile} />
      <label ref={fileUploaderRef} htmlFor={`file_${editor.id}`} />
    </>
  )
}

export default EditorOverlayElements
