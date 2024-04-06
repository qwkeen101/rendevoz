import { MetaObject, StringFieldFilterRule } from '~/typings'

function stringFilter<T extends MetaObject>(rule: StringFieldFilterRule, va: (o: T) => string | undefined): (obj: T) => boolean {
  const { type, value } = rule
  const func = (o: T) => {
    let fieldValue = va(o)
    if (typeof fieldValue !== 'string' && fieldValue !== undefined) return false
    if (!value?.length && rule.type !== 'not empty') return true
    fieldValue = fieldValue ?? ''
    const nocaseRegexp = new RegExp(value, 'i')
    const startsWithRegexp = new RegExp('^' + value, 'i')
    const endsWithRegexp = new RegExp(value + '$', 'i')
    switch (type) {
      case 'contains': {
        return nocaseRegexp.test(fieldValue)
      }
      case 'not contains': {
        return !nocaseRegexp.test(fieldValue)
      }
      case 'starts with': {
        return startsWithRegexp.test(fieldValue)
      }
      case 'ends with': {
        return endsWithRegexp.test(fieldValue)
      }
      case 'is': {
        return fieldValue === value
      }
      case 'is not': {
        return fieldValue !== value
      }
      case 'empty': {
        return fieldValue === ''
      }
      case 'not empty': {
        return fieldValue !== ''
      }
    }
  }
  return func
}

export default stringFilter
