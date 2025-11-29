export const getIndexesOfMatchStr = (searchStr: string, str: string, caseSensitive?: boolean) => {
  const searchStrLen = searchStr.length
  if (searchStrLen == 0) {
    return []
  }
  let startIndex = 0,
    index
  const indices = []
  if (!caseSensitive) {
    str = str.toLowerCase()
    searchStr = searchStr.toLowerCase()
  }
  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
    indices.push(index)
    startIndex = index + searchStrLen
  }
  return indices
}

export function sortStrings<T>(strs: T[], slice?: (o: T) => string) {
  const sliced = strs.slice()
  const extracter = (o: T) => {
    if (slice) {
      return slice(o)
    }
    if (typeof o === 'string') return o
    return ''
  }
  sliced.sort((a, b) => extracter(a).localeCompare(extracter(b), undefined, { numeric: true }))
  return sliced
}
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
export const compareStrings = (a: string | undefined = '', b: string | undefined = '') => {
  if (a === b) return 0
  if (!a) return 1
  if (!b) return -1
  return collator.compare(a, b)
}
