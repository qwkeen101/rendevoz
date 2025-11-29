import { MetaStore, NoteStore, ObjectStore } from '@/api/stores'
import { FEED_CONTENT_CACHE } from '@/core/components/feed/contentCache'
import FileSystem from '@/api/fileSystem'
import { IFeedItem } from '~/typings'

function getDomainFromUrl(url: string) {
  try {
    const urlObject = new URL(url)
    return urlObject.host
  } catch (e) {
    return url
  }
}
export default async (item: IFeedItem) => {
  let state = item.state
  if (!state) {
    state = {
      title: item.title,
      description: item.description
    }
  }
  const webpageContent = FEED_CONTENT_CACHE.get(item.id)
  const { meta: webpageMeta, one: webpageOne } = await ObjectStore('webpage').addOneWithMeta(
    {
      url: item.link,
      author: state?.author,
      feedCollectionId: item.collectionId,
      title: item.title,
      domain: item.source ?? state?.domain ?? getDomainFromUrl(item.link),
      favicon: item.favicon ?? state?.favicon
    },
    {
      silent: true,
      currentMeta: {
        name: item.title
      }
    }
  )
  if (webpageMeta) {
    NoteStore.saveNoteAsSearch(webpageContent ?? [], webpageMeta.id)
    if (item.image) {
      FileSystem.saveImage(item.image).then(image => {
        MetaStore.updateMetaObject({ id: webpageMeta.id, coverImgSrc: image })
      })
    }
  }
  if (webpageOne) {
    if (webpageContent) {
      NoteStore.initializeNoteWithValue(webpageContent).then(n => {
        ObjectStore('webpage').updateOne({ id: webpageOne.id, noteId: n.id })
      })
    }
  }
  return webpageMeta
}
