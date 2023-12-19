import { Content } from '@/components'
import { EditorProps } from '~/typings'
import TabTitle from '@/components/layout/TabTitle'
import { FC } from 'react'
import { globalStore, MetaStore } from '@/api/stores'
import { GlobalTranslateInstance } from '@/core/global/translate/GlobalTranslatePanel'
import { GlobalSearchInstance } from '@/core/global/GlobalSearchPanel'
import { objectIdToMetaObjectIdMapAtom } from '@/api/stores/meta.store'
import NoteEditor from '@/core/components/editor/noteEditor/NoteEditor'

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
          onInstanceInitialized={i => {
            onInstanceInitialized?.(i)
          }}
        />
      </div>
    </Content>
  )
}

export default EditorPage
