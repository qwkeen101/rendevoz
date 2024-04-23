import { MetaStore, ObjectStore } from '@/api/stores'
import { useEffect, useState } from 'react'
import { useGlobalAtomValue } from '@/hooks'
import { UrlToWebpageMap } from '@/core/components/webpage/hooks/useWebpageContent'
import { urlToAudioMapAtom, urlToTweetMapAtom, urlToVideoMapAtom } from '@/core/components/media/wrappers/useRealId'

export default (feedItemId: number) => {
  const item = ObjectStore('feed').useValue(feedItemId)
  const [isMeta, setIsMeta] = useState(false)
  const [metaId, setMetaId] = useState<number>()
  const urlToWebpage = useGlobalAtomValue(UrlToWebpageMap)
  const urlToAudio = useGlobalAtomValue(urlToAudioMapAtom)
  const urlToVideo = useGlobalAtomValue(urlToVideoMapAtom)
  const urlToTweet = useGlobalAtomValue(urlToTweetMapAtom)
  const objectMap = MetaStore.useIndexedMetaObjects()?.objectIdToMetaObjectMap
  useEffect(() => {
    if (!item?.link) {
      setIsMeta(false)
      setMetaId(undefined)
      return
    }
    if (
      urlToAudio.has(item.enclosure?.url || '') ||
      urlToAudio.has(item.link) ||
      urlToTweet.has(item.link) ||
      urlToVideo.has(item.link) ||
      urlToWebpage.has(item.link)
    ) {
      setIsMeta(true)
      const objectId =
        urlToWebpage.get(item.link) ||
        urlToTweet.get(item.link) ||
        urlToAudio.get(item.enclosure?.url || '') ||
        urlToVideo.get(item.link) ||
        urlToAudio.get(item.link)
      if (objectId) {
        const meta = MetaStore.getMetaObjectByObjectId(objectId)
        if (meta) {
          setMetaId(meta.id)
        }
      } else {
        setMetaId(undefined)
      }
    } else {
      setMetaId(undefined)
      setIsMeta(false)
    }
  }, [item?.link, objectMap])

  return {
    isMeta,
    metaId
  }
}
