import { FeedItem } from '@/core/feed/types'
import { NoteStore, ObjectStore } from '@/stores'
import { fetchRemoteImageAndSaveLocally } from '@/utils'

export default async (item: FeedItem) => {
  console.log(item)
  if (!item.state?.content) return
  let imageSrc: string | undefined = undefined
  if (item.image) {
    imageSrc = await fetchRemoteImageAndSaveLocally(item.image)
  }
  const { meta: webpageMeta, one: webpage } = await ObjectStore('webpage').addOneWithMeta(
    {
      url: item.link,
      author: item.state.author,
      title: item.state.title,
      domain: item.state.domain
    },
    {
      silent: true,
      currentMeta: {
        name: item.state.title,
        description: item.description,
        coverImgSrc: imageSrc
      }
    }
  )
  const contentNote = await NoteStore.initializeNoteWithValue(item.state.content, {
    metaId: webpageMeta.id
  })
  await ObjectStore('webpage').updateOne({ id: webpage.id, noteId: contentNote.id })
}
