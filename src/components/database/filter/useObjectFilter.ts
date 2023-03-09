import { relatedMetaObjectsMapAtom, tagToMetaObjectIdsMapAtom, undeletedMetaObjectsAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores'
import { isWithinInterval } from 'date-fns'
import fuzzysort from 'fuzzysort'
import { useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { useEffect, useMemo } from 'react'
import { MetaObject } from '~/typings/data'
import { FilterType } from '.'

export const FilterNameSearchAtom = atom<string>('')
export const FilterSelectedTagsAtom = atom<Map<number, Set<string>>>(new Map())
export const FilterDateIntervalsAtom = atom<Partial<Interval>>({})
export const FilterTypesAtom = atom<Set<MetaObject['type']>>(new Set<MetaObject['type']>())
export const CurrentFocusFilterAtom = atom<
  | {
      id: number
      type: FilterType
    }
  | undefined
>(undefined)
// 并集和交集结合
export const FilterRelatedIdsAtom = atom<Map<number, Set<number>>>(new Map())

export const RealFilterRelatedIdsAtom = atom<Map<number, Set<number>>>(new Map())
const useObjectFilter = (onChange: (ids: Set<number>) => void, store?: any) => {
  const nameFilter = useAtomValue(FilterNameSearchAtom, { store })
  const tagFilter = useAtomValue(FilterSelectedTagsAtom, { store })
  const createDateFilter = useAtomValue(FilterDateIntervalsAtom, { store })
  const typeFilter = useAtomValue(FilterTypesAtom, { store })
  const realFilterRelatedIds = useAtomValue(RealFilterRelatedIdsAtom, { store })
  const undeletedMetaObjects = useAtomValue(undeletedMetaObjectsAtom, { store: globalStore })
  const tagToMetaObjectIdsMap = useAtomValue(tagToMetaObjectIdsMapAtom, { store: globalStore })
  const filterMap = useMemo(() => {
    const map = new Map<string, Set<number>>()
    return map
  }, [])
  useEffect(() => {
    if (nameFilter === '' || nameFilter === undefined) {
      filterMap.delete('name')
      triggerChange()
      return
    }
    const result = fuzzysort.go(nameFilter, undeletedMetaObjects, { keys: ['name', 'description'] })
    const filteredIdSet = new Set(Array.from(result.values()).map(i => i.obj.id))
    filterMap.set('name', filteredIdSet)
    triggerChange()
  }, [nameFilter])
  useEffect(() => {
    if (tagFilter.size === 0) {
      filterMap.delete('tag')
      triggerChange()
      return
    }
    const idSetArr: Set<number>[] = []
    tagFilter.forEach(tags => {
      const idSet = new Set<number>()
      tags.forEach(tag => {
        const objIdSet = tagToMetaObjectIdsMap?.get(tag)
        if (objIdSet) {
          objIdSet.forEach(i => {
            idSet.add(i)
          })
        }
      })
      idSetArr.push(idSet)
    })

    filterMap.set('tag', intersectionOfMultipleSets(...idSetArr) as Set<number>)
    triggerChange()
  }, [tagFilter])
  useEffect(() => {
    if (Object.keys(createDateFilter).length === 0) {
      filterMap.delete('createdAt')
      triggerChange()
      return
    }
    const interval = structuredClone(createDateFilter) as Interval
    if (interval.end === undefined) {
      interval.end = new Date()
    }
    if (interval.start === undefined) {
      interval.start = new Date(0)
    }
    if (interval.end < interval.start) return
    const filteredIds = undeletedMetaObjects.filter(i => isWithinInterval(i.createdAt, interval)).map(i => i.id)
    filterMap.set('createdAt', new Set(filteredIds))
    triggerChange()
  }, [createDateFilter])
  useEffect(() => {
    if (typeFilter.size === 0) {
      filterMap.delete('type')
      triggerChange()
      return
    }
    const idSet = new Set<number>()
    undeletedMetaObjects.forEach(obj => {
      if (typeFilter.has(obj.type)) {
        idSet.add(obj.id)
      }
    })
    filterMap.set('type', idSet)
    triggerChange()
  }, [typeFilter])
  useEffect(() => {
    if (realFilterRelatedIds.size === 0) {
      filterMap.delete('related')
      triggerChange()
      return
    }
    const relatedIdMap = globalStore.get(relatedMetaObjectsMapAtom)
    const a = Array.from(realFilterRelatedIds.values()).map(ids => {
      const currentSetRelatedIds = new Set<number>()
      ids.forEach(id => {
        relatedIdMap.get(id)?.forEach(i => currentSetRelatedIds.add(i))
        currentSetRelatedIds.add(id)
      })
      return currentSetRelatedIds
    })
    const intersection = intersectionOfMultipleSets(...a)
    console.log(intersection)
    filterMap.set('related', intersection)
    triggerChange()
  }, [realFilterRelatedIds])
  useEffect(() => {
    triggerChange()
  }, [undeletedMetaObjects])
  const triggerChange = () => {
    const sets = Array.from(filterMap.values())
    if (sets.length === 0) {
      onChange(new Set(undeletedMetaObjects.map(i => i.id)))
      return
    }
    const result = intersectionOfMultipleSets(...sets) as Set<number>
    onChange(result)
  }
}
export const intersectionOfMultipleSets = (...sets: Set<any>[]) => {
  const res = new Set()
  if (sets.length) {
    sets.sort((a, b) => a.size - b.size)
    const smallest = sets.shift()
    for (const val of smallest) {
      if (sets.every(s => s.has(val))) {
        res.add(val)
      }
    }
  }
  return res
}

export default useObjectFilter
