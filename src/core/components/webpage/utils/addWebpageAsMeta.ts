import { WebpageState } from '@/core/components/webpage/hooks/useWebpageState'
import { MetaStore, NoteStore, ObjectStore } from '@/api/stores'
import { MetaObject } from '~/typings'
import FileSystem from '@/api/fileSystem'

export default async (
  state: {
    url: string
    name: string
    image?: string
    favicon?: string
  },
  value: import('slate').Descendant[],
  meta?: Partial<MetaObject>
) => {
  const webpage = await ObjectStore('webpage').addOneWithMeta(
    {
      url: state.url,
      favicon: state.favicon
    },
    {
      silent: true,
      currentMeta: {
        ...meta,
        temp: meta?.temp ?? (meta ? false : true),
        name: state.name,
        description: meta?.description === state.name ? undefined : meta?.description
      }
    }
  )
  if (state.image) {
    FileSystem.saveImage(state.image).then(res => {
      MetaStore.updateMetaObject({ id: webpage.meta.id, coverImgSrc: res })
    })
  }
  NoteStore.initializeNoteWithValue(value).then(res => {
    ObjectStore('webpage').updateOne({ id: webpage.one.id, noteId: res.id })
    ObjectStore('note').updateOne({ id: res.id, metaId: webpage.meta.id })
  })
  return webpage
}
