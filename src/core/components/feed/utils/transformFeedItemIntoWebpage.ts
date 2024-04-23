import { FeedItem } from '@/core/components/feed/types'
import { NoteStore, ObjectStore } from '@/api/stores'
import { fetchRemoteImageAndSaveLocally } from '@/utils'
import { FEED_CONTENT_CACHE } from '@/core/components/feed/contentCache'

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
  const webpageContent = FEED_CONTENT_CACHE.get(item.id)
  let noteId = undefined
  if (webpageContent) {
    const n = await NoteStore.initializeNoteWithValue(webpageContent)
    noteId = n.id
  }
  console.log(item)
  const { meta: webpageMeta } = await ObjectStore('webpage').addOneWithMeta(
    {
      url: item.link,
      author: state.author,
      title: item.title,
      domain: state.domain,
      noteId
    },
    {
      silent: true,
      currentMeta: {
        name: item.title,
        coverImgSrc: imageSrc
      }
    }
  )
  return webpageMeta
}
