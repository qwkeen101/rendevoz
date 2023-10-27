import { MetaStore, ObjectStore } from '@/stores'
import { useEffect, useState } from 'react'
import { useGlobalAtomValue } from '@/hooks'
import { UrlToWebpageMap } from '@/core/webpage/hooks/useWebpageContent'
import { urlToAudioMapAtom, urlToVideoMapAtom } from '@/core/media/wrappers/useRealId'

export default (feedItemId: number) => {
  const item = ObjectStore('feed').useValue(feedItemId)
  const [isMeta, setIsMeta] = useState(false)
  const [metaId, setMetaId] = useState<number>()
  const urlToWebpage = useGlobalAtomValue(UrlToWebpageMap)
  const urlToAudio = useGlobalAtomValue(urlToAudioMapAtom)
  const urlToVideo = useGlobalAtomValue(urlToVideoMapAtom)
  const objectMap = MetaStore.useIndexedMetaObjects()?.objectIdToMetaObjectMap
  useEffect(() => {
    if (!item?.link) {
      setIsMeta(false)
      setMetaId(undefined)
      return
    }
    if (urlToAudio.has(item.link) || urlToVideo.has(item.link) || urlToWebpage.has(item.link)) {
      setIsMeta(true)
      const objectId = urlToWebpage.get(item.link) || urlToVideo.get(item.link) || urlToAudio.get(item.link)
      if (objectId) {
        console.log(objectId)
        const meta = MetaStore.getMetaObjectByObjectId(objectId)
        console.log(meta)
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
