import { MetaStore } from '@/api/stores'

export default {
  getRelatedLinks: (id: number) => {
    const related = MetaStore.getIndexedMetaLinks()?.relatedIdsMap
    return Array.from(related?.get(id) || [])
  }
}
