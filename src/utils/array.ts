export const pushNumberIntoUnrepeatableArray = (value: number, origin?: number[]) => {
  const set = new Set([...(origin || [])])
  set.add(value)
  return Array.from(set.values())
}
