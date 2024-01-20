export default function <T>(arr: T[], keyFunc: (o: T) => number | string | number[] | string[]): Record<string, T[]> {
  const r = {}
  arr.forEach(i => {
    const key = keyFunc(i)
    if (Array.isArray(key)) {
      key.forEach(k => {
        r[k] = (r[k] || []).concat(i)
      })
    } else {
      r[key] = (r[key] || []).concat(i)
    }
  })
  return r
}
