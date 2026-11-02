export const ensureMap = <T extends { id: number }>(value?: Map<number, T> | T[] | undefined) => {
  if (!value) return new Map<number, T>()
  if (value instanceof Map) return value
  return new Map<number, T>(value.map(item => [item.id, item]))
}
