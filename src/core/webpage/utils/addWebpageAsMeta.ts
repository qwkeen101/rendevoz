import { IWebpageState, WebpageState } from '@/core/webpage/hooks/useWebpageState'
import { NoteStore, ObjectStore } from '@/api/stores'
import { fetchRemoteImageAndSaveLocally } from '@/utils'
import { MetaObject } from '~/typings'

export default async (webpageState: WebpageState, value: import('slate').Descendant[], meta?: Partial<MetaObject>) => {
  const note = await NoteStore.initializeNoteWithValue(value)
  const webpage = await ObjectStore('webpage').addOneWithMeta(
    {
      ...webpageState,
      noteId: note.id
    },
    {
      silent: true,
      currentMeta: {
        ...meta,
        name: webpageState.title,
        description: meta?.description === webpageState.title ? undefined : meta?.description,
        coverImgSrc: webpageState.image ? await fetchRemoteImageAndSaveLocally(webpageState.image) : undefined
      }
    }
  )
  await ObjectStore('note').updateOne({ id: note.id, metaId: webpage.meta.id })
  return webpage
}
