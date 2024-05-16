import SearchHelper from '@/api/textSearch/SearchHelper'
import { MetaStore } from '@/api/stores'

export default async function searchGlobalText(query: string, showDeleted = true) {
  const res = await SearchHelper.searchDocument({ queryText: query })
  return res.filter(i => {
    const meta = MetaStore.getCachedMetaObject(i.metaId)
    if (meta) {
      if (meta.deleted) {
        if (showDeleted) {
          return true
        }
        return false
      }
      return true
    }
    return false
  })
}
