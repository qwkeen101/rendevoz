import { MetaStore, ObjectStore } from '@/api/stores'
import { useURLToId } from '@/api/indexData'

export default (id?: number) => {
  const video = ObjectStore('youtubeVideo').useValue(id)
  const url = video ? `https://www.youtube.com/embed/${video?.videoId}` : undefined
  const urlId = useURLToId(url)
  const meta = MetaStore.useObjectToMetaValue(urlId)
  if (meta?.type === 'video' && !meta.temp && !meta.deleted) {
    return meta
  }
}
