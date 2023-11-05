import { FeedItem } from '@/core/feed/types'
import { NoteStore, ObjectStore } from '@/stores'
import { fetchRemoteImageAndSaveLocally } from '@/utils'

export default async (item: FeedItem) => {
  let imageSrc: string | undefined = undefined
  if (item.image) {
    imageSrc = await fetchRemoteImageAndSaveLocally(item.image)
  }
  let state = item.state
  if (!state) {
    state = {
      title: item.title,
      description: item.description
    }
  }
  const { meta: webpageMeta, one: webpage } = await ObjectStore('webpage').addOneWithMeta(
    {
      url: item.link,
      author: state.author,
      title: state.title,
      domain: state.domain
    },
    {
      silent: true,
      currentMeta: {
        name: state.title,
        description: state.title === item.description ? undefined : item.description,
        coverImgSrc: imageSrc
      }
    }
  )
  const contentNote = await NoteStore.initializeNoteWithValue(item.state.content, {
    metaId: webpageMeta.id
  })
  await ObjectStore('webpage').updateOne({ id: webpage.id, noteId: contentNote.id })
}
