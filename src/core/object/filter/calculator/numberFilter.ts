import { MetaObject, PropertyFilterRule } from '~/typings'

export default function numberFilter<T extends MetaObject>(
  rule: PropertyFilterRule & { propType: 'number' },
  v: (o: T) => number | undefined
): (obj: T) => boolean {
  const { type, value } = rule
  const func = (o: T) => {
    let fieldValue = v(o)
    if (fieldValue === undefined && (type === 'empty' || type === 'is not')) return true
    if (typeof fieldValue !== 'number' && fieldValue !== undefined) return false
    if (value === undefined) return true
    fieldValue = fieldValue ?? 0
    switch (type) {
      case 'is': {
        return fieldValue === value
      }
      case 'is not': {
        return fieldValue !== value
      }
      case 'gt': {
        return fieldValue > value
      }
      case 'gte': {
        return fieldValue >= value
      }
      case 'lt': {
        return fieldValue < value
      }
      case 'lte': {
        return fieldValue <= value
      }
      case 'not empty':
        return fieldValue !== undefined
    }

    return false
  }
  return func
}
