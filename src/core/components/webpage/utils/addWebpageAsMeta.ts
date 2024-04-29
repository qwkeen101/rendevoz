import { WebpageState } from '@/core/components/webpage/hooks/useWebpageState'
import { NoteStore, ObjectStore } from '@/api/stores'
import { MetaObject } from '~/typings'
import FileSystem from '@/api/fileSystem'

export default async (webpageState: WebpageState, value: import('slate').Descendant[], meta?: Partial<MetaObject>) => {
  const note = await NoteStore.initializeNoteWithValue(value)
  const removeDeleted = { ...webpageState }
  delete removeDeleted.content
  const webpage = await ObjectStore('webpage').addOneWithMeta(
    {
      ...removeDeleted,
      noteId: note.id
    },
    {
      silent: true,
      currentMeta: {
        ...meta,
        name: webpageState.title,
        description: meta?.description === webpageState.title ? undefined : meta?.description,
        coverImgSrc: webpageState.image ? await FileSystem.saveImage(webpageState.image) : undefined
      }
    }
  )
  await ObjectStore('note').updateOne({ id: note.id, metaId: webpage.meta.id })
  return webpage
}
