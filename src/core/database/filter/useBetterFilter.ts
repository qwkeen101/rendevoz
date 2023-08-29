import { useEffect, useState } from 'react'
import { atom, useAtom } from 'jotai'
import { LinkFilterRule, MetaFilterGroup, MetaFilterRule, MetaObject } from '~/typings'
import { MetaStore } from '@/stores'
import stringFilter from '@/core/database/filter/stringFilter'
import dateFilter from '@/core/database/filter/dateFilter'
import linkFilter from '@/core/database/filter/linkFilter'
import typeFilter from '@/core/database/filter/typeFilter'
import tagFilter from '@/core/database/filter/tagFilter'

const BetterFiltersAtom = atom<MetaFilterGroup>({
  rules: [
    {
      filterType: 'link',
      type: 'source',
      linkType: 'spec',
      metaId: 14516102227141
    },
    {
      filterType: 'link',
      type: 'target',
      linkType: 'spec',
      metaId: 14516102227141
    }
  ],
  groupType: 'and',
  filterType: 'group'
})

const transformRules = (rules: MetaFilterRule[]) => {
  const finalRuleFilter = (rules.filter(i => i.filterType === 'rule') as (MetaFilterRule & { filterType: 'rule' })[])
    .map(rule => {
      switch (rule.field) {
        case 'name':
        case 'description':
          return stringFilter(rule.field, rule.value, rule.type)
        case 'type':
          return typeFilter(rule)
        case 'tags':
          return tagFilter(rule)
        case 'createdAt':
        case 'viewAt':
        case 'updatedAt':
          return dateFilter(rule)
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

export const calculateFilterObjects = (filter: MetaFilterGroup, objects?: number[]) => {
  const filterFunc = transformFilterGroupToFilterArray(filter)
  if (filterFunc !== undefined) {
    const map = MetaStore.getMetaObjectsMap()
    const allObjects = objects
      ? (objects.map(i => map.get(i)).filter(i => i) as MetaObject[])
      : Array.from(MetaStore.getMetaObjectsMap().values())
    allObjects.sort((b, a) => a.createdAt - b.createdAt)
    const leftObjects = allObjects.filter(filterFunc)
    return leftObjects
  }
}
const useBetterFilter = () => {
  const [filterRoot, setFilterRoot] = useAtom(BetterFiltersAtom)
  setTimeout(() => {
    const filterFunc = transformFilterGroupToFilterArray(filterRoot)
    if (filterFunc !== undefined) {
      const allObjects = Array.from(MetaStore.getMetaObjectsMap().values())
      const leftObjects = allObjects.filter(filterFunc)
      console.log(leftObjects)
    }
  }, 3000)
  // useEffect(() => {
  //   const filterFunc = transformFilterGroupToFilterArray(filterRoot)
  //   if (filterFunc !== undefined) {
  //     const allObjects = Array.from(MetaStore.getMetaObjectsMap().values())
  //     const leftObjects = allObjects.filter(filterFunc)
  //     console.log(leftObjects)
  //   }
  // }, [filterRoot])
}

export default useBetterFilter
