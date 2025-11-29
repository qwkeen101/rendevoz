import { LinkFilterRule, MetaFilterGroup, MetaFilterRule, MetaObject } from '~/typings'
import stringFilter from './calculator/stringFilter'
import dateFilter from './calculator/dateFilter'
import linkFilter from './calculator/linkFilter'
import typeFilter from './calculator/typeFilter'
import tagFilter from './calculator/tagFilter'
import optionFilter from './calculator/optionFilter'
import numberFilter from './calculator/numberFilter'
import checkboxFilter from './calculator/checkboxFilter'
import containsFilter from './calculator/containsFilter'

const transformRules = async (rules: MetaFilterRule[]) => {
  const finalRuleFilter = (
    await Promise.all(
      (rules.filter(i => i.filterType === 'rule') as (MetaFilterRule & { filterType: 'rule' })[]).map(async rule => {
        if ('propType' in rule) {
          switch (rule.propType) {
            case 'string':
            case 'URL':
              return stringFilter(rule, o => o['properties']?.[rule.field]?.value as string | undefined)
            case 'checkbox':
              return checkboxFilter(rule, o => o['properties']?.[rule.field]?.value as boolean | undefined)
            case 'number':
              return numberFilter(rule, o => o['properties']?.[rule.field]?.value as number | undefined)
            case 'singleSelect':
            case 'multiSelect':
              return optionFilter(rule, o => o['properties']?.[rule.field]?.value as number | number[] | undefined)
            case 'date':
              return dateFilter(rule, o => o['properties']?.[rule.field]?.value as number | undefined)
          }
        }
        switch (rule.field) {
          case 'name':
            return stringFilter(rule, o => o.name || o.placeholderName)
          case 'description':
            return stringFilter(rule, o => o.description)
          case 'type':
            return typeFilter(rule)
          case 'tags':
            return tagFilter(rule)
          case 'createdAt':
          case 'viewAt':
          case 'updatedAt':
            return dateFilter(rule, o => o[rule.field])
          case 'contains':
            return await containsFilter(rule)
        }
      })
    )
  ).filter(i => i) as ((meta: MetaObject) => boolean)[]
  const linkRules = await Promise.all((rules.filter(i => i.filterType === 'link') as LinkFilterRule[]).map(async i => await linkFilter(i)))
  const groupRules = rules.filter(i => i.filterType === 'group') as MetaFilterGroup[]
  const flattenedGroupRules = await Promise.all(
    groupRules.flatMap(async i => {
      if (i.groupType === 'and') {
        return await concatAndFilters(i.rules)
      } else {
        return await concatOrFilters(i.rules)
      }
    })
  )
  const allRules = [...finalRuleFilter, ...linkRules, ...flattenedGroupRules]
  return allRules
}
const concatAndFilters = async (rules: MetaFilterRule[]): Promise<(meta: MetaObject) => boolean> => {
  const allRules = await transformRules(rules)
  return (meta: MetaObject) => {
    if (allRules.every(f => f(meta))) {
      return true
    } else {
      return false
    }
  }
}

const concatOrFilters = async (rules: MetaFilterRule[]): Promise<(meta: MetaObject) => boolean> => {
  const allRules = await transformRules(rules)
  return (meta: MetaObject) => {
    if (allRules.some(f => f(meta))) {
      return true
    } else {
      return false
    }
  }
}

export const transformFilterGroupToFilterArray = async (rootGroup: MetaFilterGroup) => {
  let f: ((m: MetaObject) => boolean) | undefined = undefined
  if (!rootGroup.rules.length) return
  if (rootGroup.groupType === 'and') {
    f = await concatAndFilters(rootGroup.rules)
  } else {
    f = await concatOrFilters(rootGroup.rules)
  }
  return f
}
