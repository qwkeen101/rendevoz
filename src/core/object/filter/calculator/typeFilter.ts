import { MetaFilterRule } from '~/typings'

function typeFilter<T>(rule: MetaFilterRule & { field: 'type'; filterType: 'rule' }): (o: T) => boolean {
  const func = (o: T) => {
    const fieldValue = o[rule.field]
    if (!rule.value) return false
    if (typeof fieldValue !== 'string') return false
    switch (rule.type) {
      case 'is': {
        return fieldValue === rule.value
      }
      case 'is not': {
        return fieldValue !== rule.value
      }
    }
  }
  return func
}

export default typeFilter
