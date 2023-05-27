import { Content, Icon } from '@/components'
import { DraggingElement, Editor, GlobalDragOverlayInstance, ReactEditor } from '@/core'
import { CustomEditor } from '~/typings'
import TabTitle from '@/components/layout/TabTitle'
import { FC, useState } from 'react'
import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { Descendant } from 'slate'
import SidebarToolbar from './HoverOutline'
import { ObjectStore, globalStore } from '@/stores'
import { Provider } from 'jotai'
import { GlobalTranslateInstance } from '@/core/global/GlobalTranslatePanel'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'

const EditorPage: FC<{
  noteId: number
  id: string
  disableTitle?: boolean
  defaultReadOnly?: boolean
  onTitleChange?: (t: string) => void
  onEditorInitialized?: (editor: CustomEditor) => void
}> = ({ noteId, id, onEditorInitialized, disableTitle, onTitleChange, defaultReadOnly = false }) => {
  const [title, setTitle] = useState('Untitled')
  const [readOnly, toggleReadOnly] = useToggle(defaultReadOnly)
  const [value, setValue] = useState<Descendant[]>([])
  const [editor, setEditor] = useState<CustomEditor>()
  return (
    <Content fullHeight fullWidth flex centered>
      {!disableTitle && <TabTitle title={title} icon="park-notes" />}
      <Icon
        name={readOnly ? 'park-edit' : 'park-book-open'}
        onClick={toggleReadOnly}
        className={ClassName.circleButton()}
        size={18}
        containerStyle={{ position: 'absolute', top: 30, right: 30, zIndex: 10 }}
      />
      <Provider>{editor && <SidebarToolbar value={value} editor={editor} />}</Provider>
      <Editor
        id={id}
        noteId={noteId}
        showToolbar
        readonly={readOnly}
        onChange={e => setValue(e)}
        onHighlightDrag={(highlightId, editor) => {
          const editorNode = ReactEditor.toDOMNode(editor, editor)
          const highlightTextContent = Array.from(editorNode.querySelectorAll(`[data-highlight="${highlightId}"]`)).reduce((prev, curr) => {
            return prev + curr.textContent
          }, '')
          GlobalDragOverlayInstance.draggingDetails = {
            type: 'note label',
            highlightId,
            noteId: noteId,
            textContent: highlightTextContent
          }
        }}
        onSearch={(text, id, e, editor) => {
          GlobalSearchInstance.open?.({
            e,
            query: text,
            from: {
              type: 'note',
              metaId: globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(editor.noteId),
              selectedText: text,
              blockId: id
            }
          })
        }}
        onTitleChange={e => {
          setTitle(e)
          onTitleChange?.(e)
        }}
        onTranslate={(text, id, e, editor) => {
          GlobalTranslateInstance.open?.({
            e,
            query: text,
            source: {
              type: 'note',
              objectId: editor.noteId!,
              blockId: id
            }
          })
        }}
        onHighlight={highlightId => {
          ObjectStore('noteLabel').addOne({
            id: highlightId,
            noteId
          })
        }}
        onEditorInitialized={e => {
          onEditorInitialized?.(e)
          setEditor(e)
        }}
        onHighlightRemove={h => {
          ObjectStore('noteLabel').deleteOneById(h, { silent: true, force: true })
        }}
      />
    </Content>
  )
}

export default EditorPage
