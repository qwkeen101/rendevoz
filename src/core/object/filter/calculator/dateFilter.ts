import { DateFieldFilterRule, MetaObject, PropertyFilterRule } from '~/typings'
import { isEqual, isAfter, isBefore } from 'date-fns'
function dateFilter<T extends MetaObject>(
  rule: PropertyFilterRule & { propType: 'date' },
  v: (o: T) => number | number[] | undefined
): (obj: T) => boolean {
  let transformedDate = new Date(Date.now())
  const { type } = rule
  if (rule.specDate) {
    transformedDate = new Date(rule.specDate)
  }

  switch (rule.value) {
    case 'today':
      break
    case 'yesterday':
      transformedDate.setDate(transformedDate.getDate() - 1)
      break
    case 'one week ago':
      transformedDate.setDate(transformedDate.getDate() - 7)
      break
    case 'one month ago':
      transformedDate.setMonth(transformedDate.getMonth() - 1)
      break
    case 'three month ago':
      transformedDate.setMonth(transformedDate.getMonth() - 3)
      break
  }
  transformedDate.setHours(0, 0, 0, 0)
  const func = (o: T) => {
    const fieldValue = v(o)
    if (fieldValue === undefined && type === 'empty') return true
    if (typeof fieldValue === 'number' && type === 'not empty') return true
    if (typeof fieldValue !== 'number') return false
    const fieldDate = new Date(fieldValue)
    fieldDate.setHours(0, 0, 0, 0)
    switch (type) {
      case 'is':
        return isEqual(transformedDate, fieldDate)
      case 'after':
        return isBefore(transformedDate, fieldDate)
      case 'before':
        return isAfter(transformedDate, fieldDate)
      case 'on and after':
        return isEqual(transformedDate, fieldDate) || isBefore(transformedDate, fieldDate)
      case 'on and before':
        return isEqual(transformedDate, fieldDate) || isAfter(transformedDate, fieldDate)
    }
    return false
  }
  return func
}

export default dateFilter
