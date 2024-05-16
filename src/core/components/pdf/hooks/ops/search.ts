import { IPDFInstance } from '~/typings'
import { normalizeText } from '@/core/components/pdf/core/utils/search'

export default (query: string, instance: IPDFInstance) => {
  const results: {
    searchText: string
    pageIndex: number
    num: number
  }[] = []
  const text = instance.values.texts
  const search = normalizeText(query).replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
  const reg = new RegExp(search, 'gi')
  const quickFilter = text.filter(i => i.str.match(reg))
  quickFilter.forEach(i => {
    const reg = new RegExp(search, 'gi')
    const allIndice = [...i.str.matchAll(reg)].map(i => i.index)
    const indexes = allIndice.reduce((prev, curr, idx) => {
      if (idx === 0) {
        prev.push(curr)
      } else {
        const last = prev[prev.length - 1]
        if (curr - last > 20 + search.length) {
          prev.push(curr)
        }
      }
      return prev
    }, [] as number[])
    const strLimit = indexes.length >= 3 ? 20 : indexes.length === 2 ? 25 : 30
    const str = indexes
      .slice(0, 2)
      .map(index =>
        i.str.slice(Math.max(0, index - strLimit), Math.min(index + search.length + strLimit, i.str.length)).replace(reg, '<em>$&</em>')
      )
      .join('...')
    results.push({
      pageIndex: i.page,
      searchText: str,
      num: allIndice.length
    })
  })
  return results
}
