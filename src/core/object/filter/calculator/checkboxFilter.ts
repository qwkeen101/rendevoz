import { MetaObject, PropertyFilterRule } from '~/typings'

export default function checkboxFilter<T extends MetaObject>(
  rule: PropertyFilterRule & { propType: 'checkbox' },
  v: (o: T) => boolean | undefined
): (obj: T) => boolean {
  const { type, value } = rule
  const va = value ?? false
  const func = (o: T) => {
    const fieldValue = v(o) ?? false
    if (typeof fieldValue !== 'boolean') return false
    switch (type) {
      case 'is': {
        return fieldValue === va
      }
      case 'is not': {
        return fieldValue !== va
      }
    }
    return false
  }
  return func
}
