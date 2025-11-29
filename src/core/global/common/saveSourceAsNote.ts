import { MetaStore, NoteStore } from '@/api/stores'
import { deserializeMarkdown } from '@/core/components/editor/plugins/deserializeMarkdown'
import getChatTitle from '@/core/ai/chat/getChatTitle'

export default async (content: string) => {
  const note = await NoteStore.initializeNoteWithValue(deserializeMarkdown(content))
  const noteMeta = await MetaStore.addMetaObject({ type: 'note', objectId: note.id })
  getChatTitle([
    {
      role: 'user',
      content
    }
  ]).then(title => {
    MetaStore.updateMetaObject({ id: noteMeta.id, name: title })
  })
  return noteMeta.id
}
