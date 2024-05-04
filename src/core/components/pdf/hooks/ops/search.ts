import { IPDFInstance } from '~/typings'
import { normalizeText } from '@/core/components/pdf/core/utils/search'

export default (query: string, instance: IPDFInstance) => {
  const results: {
    searchText: string
    pageIndex: number
  }[] = []
  const text = instance.values.texts
  const search = normalizeText(query).replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
  const reg = new RegExp(search, 'gi')
  const quickFilter = text.filter(i => i.str.match(reg))
  quickFilter.forEach(i => {
    const reg = new RegExp(search, 'gi')
    const indexes = ([...i.str.matchAll(reg)].map(i => i.index).filter(i => i !== undefined) as number[]).reduce((prev, curr, idx) => {
      if (idx === 0) {
        prev.push(curr)
      } else {
        const last = prev[prev.length - 1]
        if (curr - last > 80 + search.length) {
          prev.push(curr)
        }
      }
      return prev
    }, [] as number[])
    // five results per page
    indexes.slice(0, 5).forEach(index => {
      let cropStr = i.str.slice(Math.max(0, index - 80), Math.min(index + search.length + 80, i.str.length)).replace(reg, '<em>$&</em>')
      const appendBefore = index - 80 > 0
      const appendAfter = index + search.length + 80 < i.str.length
      if (appendBefore) {
        cropStr = '...' + cropStr
      }
      if (appendAfter) {
        cropStr = cropStr + '...'
      }
      results.push({
        searchText: cropStr,
        pageIndex: i.page
      })
    })
  })
  return results
}
