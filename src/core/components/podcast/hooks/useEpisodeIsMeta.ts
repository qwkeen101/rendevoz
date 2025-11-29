import { MetaStore, ObjectStore } from '@/api/stores'
import { useURLToId } from '@/api/indexData'

export default (id: number) => {
  const episode = ObjectStore('episode').useValue(id)
  const object = useURLToId(episode?.enclosureURL)
  const audioMeta = MetaStore.useValue(MetaStore.useObjectToMetaValue(object)?.id)
  return audioMeta
}
