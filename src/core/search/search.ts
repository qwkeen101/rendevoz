import SearchHelper from '@/api/textSearch/SearchHelper'

export default async function searchGlobalText(query: string) {
  const res = await SearchHelper.searchDocument({ queryText: query })
  return res
}
