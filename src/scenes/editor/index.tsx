import { Content } from '@/components'
import { Editor, GlobalDragOverlayInstance, ReactEditor } from '@/core'
import { EditorProps } from '~/typings'
import TabTitle from '@/components/layout/TabTitle'
import { FC, useState } from 'react'
import { globalStore, ObjectStore } from '@/stores'
import { GlobalTranslateInstance } from '@/core/global/translate/GlobalTranslatePanel'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'


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

  return (
    <Content fullWidth fullHeight flex centered>
      {!disableTitle && <TabTitle title={title} icon="park-notes" />}
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
          readonly={outReadOnly}
          defaultReadOnly={defaultReadOnly}
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
                ObjectStore('noteLabel').deleteOneById(event.highlightId, {
                  silent: true,
                  force: true
                })
              }
            }
          }}
          onInstanceInitialized={i => {
            onInstanceInitialized?.(i)
            rest.onInstanceIntialized?.(i)
          }}
        />
      </div>
    </Content>
  )
}

export default EditorPage
