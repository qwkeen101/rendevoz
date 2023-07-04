import { Content, Icon } from '@/components'
import { Editor, GlobalDragOverlayInstance, ReactEditor } from '@/core'
import { CustomEditor, IEditorInstance } from '~/typings'
import TabTitle from '@/components/layout/TabTitle'
import { FC, useEffect, useState } from 'react'
import ClassName from '@/styles/classNames'
import { ObjectStore, globalStore } from '@/stores'
import { GlobalTranslateInstance } from '@/core/global/translate/GlobalTranslatePanel'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import { EditorProps } from '@/core/editor/Editor'
import { waitFor } from '@/utils/functions'
import { createPortal } from 'react-dom'
import { useToggle } from '@/hooks'

const EditorPage: FC<
  {
    noteId?: number
    id: string
    disableTitle?: boolean
    defaultReadOnly?: boolean
    onTitleChange?: (t: string) => void
    onInstanceInitialized?: EditorProps['onInstanceIntialized']
  } & EditorProps
> = ({ noteId, id, onInstanceInitialized, disableTitle, onTitleChange, defaultReadOnly = false, readonly: outReadOnly, ...rest }) => {
  const [title, setTitle] = useState('Untitled')
  const [readOnly, toggleReadOnly] = useToggle(defaultReadOnly)
  const [editor, setEditor] = useState<CustomEditor>()
  const [instance, setInstance] = useState<IEditorInstance>()

  const editorNode = editor && ReactEditor.toDOMNode(editor, editor).closest("[role='editor-container']")

  useEffect(() => {
    if (outReadOnly !== undefined) {
      toggleReadOnly(outReadOnly)
    }
  }, [outReadOnly])
  return (
    <Content fullWidth fullHeight flex centered>
      {!disableTitle && <TabTitle title={title} icon="park-notes" />}
      {editorNode &&
        createPortal(
          <>
            <Icon
              name={readOnly ? 'park-edit' : 'park-book-open'}
              onClick={toggleReadOnly}
              className={ClassName.circleButton()}
              size={18}
              containerStyle={{ position: 'absolute', top: 30, right: 30, zIndex: 10 }}
            />
            <Icon
              name={'park-find'}
              onClick={() => instance?.toggleSearch?.()}
              className={ClassName.circleButton()}
              size={18}
              containerStyle={{ position: 'absolute', top: 70, right: 30, zIndex: 10 }}
            />
            <Icon
              name={'park-label'}
              onClick={() => instance?.toggleLabel?.()}
              className={ClassName.circleButton()}
              size={18}
              containerStyle={{ position: 'absolute', top: 110, right: 30, zIndex: 10 }}
            />
          </>,
          editorNode
        )}
      <div
        style={{
          width: 0,
          flex: 1,
          display: 'flex',
          height: '100%'
        }}
      >
        <Editor
          {...rest}
          id={id}
          noteId={noteId}
          showToolbar={rest.showToolbar ?? true}
          readonly={readOnly}
          on={event => {
            if (rest.on) {
              rest.on(event)
              return
            }
            switch (event.type) {
              case 'highlightDrag': {
                const editorNode = ReactEditor.toDOMNode(event.editor, event.editor)
                const highlightTextContent = Array.from(editorNode.querySelectorAll(`[data-highlight="${event.highlightId}"]`)).reduce(
                  (prev, curr) => {
                    return prev + curr.textContent
                  },
                  ''
                )
                GlobalDragOverlayInstance.draggingDetails = {
                  type: 'noteLabel',
                  highlightId: event.highlightId,
                  noteId: noteId,
                  textContent: highlightTextContent
                }
                break
              }
              case 'search': {
                GlobalSearchInstance.open?.({
                  e: event.e,
                  query: event.searchedText,
                  from: {
                    type: 'note',
                    metaId: globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(event.editor.noteId),
                    selectedText: event.searchedText,
                    blockId: event.blockId
                  }
                })
                break
              }
              case 'titleChange': {
                setTitle(event.value)
                onTitleChange?.(event.value)
                break
              }
              case 'highlight': {
                break
              }
              case 'translate': {
                GlobalTranslateInstance.open?.({
                  e: event.e,
                  query: event.translatedText,
                  source: {
                    type: 'note',
                    objectId: event.editor.noteId!,
                    blockId: id
                  }
                })
                break
              }
              case 'highlightRemove': {
                ObjectStore('noteLabel').deleteOneById(event.highlightId, { silent: true, force: true })
              }
            }
          }}
          onInstanceIntialized={i => {
            onInstanceInitialized?.(i)
            rest.onInstanceIntialized?.(i)
            setInstance(i)
            waitFor(
              () => !!i.getSlateEditor?.(),
              () => setEditor(i.getSlateEditor?.())
            )
          }}
        />
      </div>
    </Content>
  )
}

export default EditorPage
