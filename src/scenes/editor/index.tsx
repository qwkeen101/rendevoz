import { Content } from '@/components'
import { EditorProps } from '~/typings'
import TabTitle from '@/components/layout/TabTitle'
import { FC } from 'react'
import { MetaStore } from '@/api/stores'
import NoteEditor from '@/core/components/editor/noteEditor/NoteEditor'

const EditorPage: FC<
  {
    noteId: number
    onInstanceInitialized?: EditorProps['onInstanceInitialized']
  } & EditorProps
> = ({ noteId, onInstanceInitialized, ...rest }) => {
  const note = MetaStore.useObjectToMetaValue(noteId)
  return (
    <>
      <TabTitle title={note?.name} icon={Global.utils.getIcon('note')} />
      <NoteEditor
        {...rest}
        noteId={noteId}
        metaId={note?.id}
        layout={{
          ...rest.layout,
          showProps: true,
          propsMetaId: note?.id,
          virtualizer: false
        }}
        onInstanceInitialized={i => {
          onInstanceInitialized?.(i)
        }}
      />
    </>
  )
}

export default EditorPage
