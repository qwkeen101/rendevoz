import { Content } from '@/components'
import { EditorProps } from '~/typings'
import TabTitle from '@/components/layout/TabTitle'
import { FC } from 'react'
import { globalStore, MetaStore } from '@/stores'
import { GlobalTranslateInstance } from '@/core/global/translate/GlobalTranslatePanel'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import NoteEditor from '@/core/editor/noteEditor/NoteEditor'

const EditorPage: FC<
  {
    noteId: number
    disableTabTitle?: boolean
    onInstanceInitialized?: EditorProps['onInstanceInitialized']
  } & EditorProps
> = ({ noteId, onInstanceInitialized, disableTabTitle, ...rest }) => {
  const note = MetaStore.useObjectToMetaValue(noteId)

  return (
    <Content fullWidth fullHeight flex centered>
      {!disableTabTitle && <TabTitle title={note?.name || 'Untitled'} icon="park-notes" />}
      <div
        style={{
          width: 0,
          flex: 1,
          display: 'flex',
          height: '100%'
        }}
      >
        <NoteEditor
          {...rest}
          noteId={noteId}
          on={event => {
            if (rest.on) {
              rest.on(event)
              return
            }
            switch (event.type) {
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
            }
          }}
          onInstanceInitialized={i => {
            onInstanceInitialized?.(i)
          }}
        />
      </div>
    </Content>
  )
}

export default EditorPage
