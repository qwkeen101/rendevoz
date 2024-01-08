import { useEffect, useState } from 'react'
import { atom, useAtom } from 'jotai'
import { LinkFilterRule, MetaFilterGroup, MetaFilterRule, MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import stringFilter from '@/core/object/filter/calculator/stringFilter'
import dateFilter from '@/core/object/filter/calculator/dateFilter'
import linkFilter from '@/core/object/filter/calculator/linkFilter'
import typeFilter from '@/core/object/filter/calculator/typeFilter'
import tagFilter from '@/core/object/filter/calculator/tagFilter'
import optionFilter from '@/core/object/filter/calculator/optionFilter'
import numberFilter from '@/core/object/filter/calculator/numberFilter'
import checkboxFilter from '@/core/object/filter/calculator/checkboxFilter'

const transformRules = (rules: MetaFilterRule[]) => {
  const finalRuleFilter = (rules.filter(i => i.filterType === 'rule') as (MetaFilterRule & { filterType: 'rule' })[])
    .map(rule => {
      if ('propType' in rule) {
        switch (rule.propType) {
          case 'string':
          case 'URL':
          case 'AI summary':
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
          return stringFilter(rule.field, rule.value, rule.type)
        case 'type':
          return typeFilter(rule)
        case 'tags':
          return tagFilter(rule)
        case 'createdAt':
        case 'viewAt':
        case 'updatedAt':
          return dateFilter(rule, o => o[rule.field])
      }
    })
    .filter(i => i) as ((meta: MetaObject) => boolean)[]
  const linkRules = (rules.filter(i => i.filterType === 'link') as LinkFilterRule[]).map(i => linkFilter(i))
  const groupRules = rules.filter(i => i.filterType === 'group') as MetaFilterGroup[]
  const flattenedGroupRules = groupRules.flatMap(i => {
    if (i.groupType === 'and') {
      return concatAndFilters(i.rules)
    } else {
      return concatOrFilters(i.rules)
    }
  })
  const allRules = [...finalRuleFilter, ...linkRules, ...flattenedGroupRules]
  return allRules
}
const concatAndFilters = (rules: MetaFilterRule[]): ((meta: MetaObject) => boolean) => {
  const allRules = transformRules(rules)
  return (meta: MetaObject) => {
    if (allRules.every(f => f(meta))) {
      return true
    } else {
      return false
    }
  }
}

const concatOrFilters = (rules: MetaFilterRule[]): ((meta: MetaObject) => boolean) => {
  const allRules = transformRules(rules)
  return (meta: MetaObject) => {
    if (allRules.some(f => f(meta))) {
      return true
    } else {
      return false
    }
  }
}

export const transformFilterGroupToFilterArray = (rootGroup: MetaFilterGroup) => {
  let f: ((m: MetaObject) => boolean) | undefined = undefined
  if (!rootGroup.rules.length) return
  if (rootGroup.groupType === 'and') {
    f = concatAndFilters(rootGroup.rules)
  } else {
    f = concatOrFilters(rootGroup.rules)
  }
  return f
}

export const calculateFilterObjects = (filter: MetaFilterGroup, objects?: number[], showHidden?: boolean) => {
  const filterFunc = transformFilterGroupToFilterArray(filter)
  if (filterFunc !== undefined) {
    const map = MetaStore.getMetaObjectsMap()
    let allObjects = objects
      ? (objects.map(i => map.get(i)).filter(i => i) as MetaObject[])
      : Array.from(MetaStore.getMetaObjectsMap().values())
    if (!showHidden) {
      allObjects = allObjects.filter(i => !i.hidden)
    }
    allObjects.sort((b, a) => a.createdAt - b.createdAt)
    const leftObjects = allObjects.filter(filterFunc)
    return leftObjects
  }
}
