import { MetaObject, PropertyFilterRule } from '~/typings'

function optionFilter<T extends MetaObject>(rule: PropertyFilterRule, v: (o: T) => number | number[] | undefined): (obj: T) => boolean {
  if (rule.propType === 'singleSelect' || rule.propType === 'reviewState') {
    const value = rule.value as number | undefined
    const ruleFilter = () => {
      switch (rule.type) {
        case 'is':
          return (sourceValue: number | undefined) => {
            return sourceValue === value
          }
        case 'is not':
          return (sourceValue: number | undefined) => {
            return sourceValue !== value
          }
        case 'empty':
          return (sourceValue: number | undefined) => sourceValue === undefined
        case 'not empty':
          return (sourceValue: number | undefined) => sourceValue !== undefined
      }
    }

    const filter = ruleFilter()
    if (filter) {
      return (o: T) => {
        const value = v(o) as number | undefined
        return filter(value)
      }
    }
    return () => true
  } else if (rule.propType === 'multiSelect') {
    const value = rule.value as number[] | undefined
    const targetValueSet = new Set([...(Array.isArray(value) ? value : [])])
    const ruleFilter = () => {
      switch (rule.type) {
        case 'contains':
          return (sourceValues: number[] | undefined) => {
            if (!sourceValues) return false
            if (sourceValues.some(id => targetValueSet.has(id))) return true
            return false
          }
        case 'not contains':
          return (sourceValues: number[] | undefined) => {
            if (!sourceValues) return true
            if (sourceValues.every(id => !targetValueSet.has(id))) return true
            return false
          }
        case 'empty':
          return (sourceValues: number[] | undefined) => sourceValues === undefined || sourceValues.length === 0
        case 'not empty':
          return (sourceValues: number[] | undefined) => sourceValues !== undefined && sourceValues.length !== 0
      }
    }
    const filter = ruleFilter()
    if (filter) {
      return (o: T) => {
        const value = v(o) as number[] | undefined
        return filter(value)
      }
    }
    return () => true
  }
  return () => true
}

export default optionFilter
