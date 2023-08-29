import { StringFieldFilterRule } from '~/typings'

function stringFilter<T>(field: keyof T, value: string, type: StringFieldFilterRule['type']): (obj: T) => boolean {
  const func = (o: T) => {
    const fieldValue = o[field]
    if (fieldValue === undefined && type === 'empty') return true
    if (typeof fieldValue !== 'string') return false
    if (!value.length) return true
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
