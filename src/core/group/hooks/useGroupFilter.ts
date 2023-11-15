import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import { MetaGroup, MetaObject } from '~/typings'
import { calculateFilterObjects } from '@/core/object/filter/useBetterFilter'
import fuzzysort from 'fuzzysort'
import { calculateSortObjects } from '@/core/object/filter/BetterSorter'
import { useSetAtom } from 'jotai'
import { GroupStateAtom } from '@/core/group/hooks/useGroupState'
import { useSelectAtomValue } from '@/hooks'

const useGroupFilter = (groupId: number) => {
  const groupData = ObjectStore('group').useValue(groupId) as MetaGroup | undefined
  const metaMap = MetaStore.useMetaObjectsMap()
  const setGroupState = useSetAtom(GroupStateAtom)
  const currentView = useSelectAtomValue(GroupStateAtom, s => s.currentView)
  const searchable = useMemo(() => {
    const map = metaMap
    const tagMap = globalStore.get(ObjectStore('tag').objectMapAtom)
    return groupData?.values
      ?.map(i => {
        const meta = map.get(i.id)
        if (!meta) return
        const tags = meta.tags?.map(i => tagMap.get(i)?.name || '').join('$')
        const from = meta.fromObject ? map.get(meta.fromObject.metaId)?.name : undefined
        return {
          name: meta.name,
          description: meta.description,
          tags,
          from,
          rowId: i.rowId
        }
      })
      .filter(i => i) as any[]
  }, [groupData?.values, metaMap])
  useLayoutEffect(() => {
    if (groupData?.values) {
      // display by value index
      const index = currentView?.valueIndex || []
      const itemPos: Record<number, number> = {}
      index.forEach((i, idx) => {
        itemPos[i] = idx
      })
      const viewValues = groupData.values.slice()
      viewValues.sort((a, b) => itemPos[a.rowId] - itemPos[b.rowId])
      if (!currentView?.filter?.rules.length && !currentView?.search?.length && !currentView?.sort?.sorters.length) {
        setGroupState(s => ({ ...s, viewValues: viewValues, filterValues: undefined }))
        return
      }
      const currentValue = groupData.values
      const map = MetaStore.getMetaObjectsMap()
      const allRows = currentValue
      const firstLayerMetaIds = allRows.filter(i => i.id).map(i => i.id) as number[]
      const afterFilterExistMetaIds = new Set([
        ...(currentView.filter?.rules.length
          ? calculateFilterObjects(currentView.filter, firstLayerMetaIds, true)?.map(i => i.id) || []
          : firstLayerMetaIds)
      ])
      const afterFilterRows = allRows.filter(i => {
        if (i.type === 'metaObject') {
          return afterFilterExistMetaIds.has(i.id)
        }
        return false
      })
      const afterFilterRowIds = new Set(afterFilterRows.map(i => i.rowId))
      let afterSearchValue = afterFilterRows

      if (currentView.search && searchable) {
        const result = fuzzysort.go(
          currentView.search,
          searchable.filter(i => afterFilterRowIds.has(i.rowId)),
          {
            keys: ['name', 'description', 'tags', 'from'],
            threshold: -400000
          }
        )
        // todo: search rank
        const afterSearchRowIds = new Set(Array.from(result.values()).map(i => i.obj.rowId))
        afterSearchValue = afterFilterRows.filter(i => afterSearchRowIds.has(i.rowId))
      }
      if (currentView.sort?.sorters.length) {
        const allMetas = afterSearchValue.map(i => i.type === 'metaObject' && map.get(i.id)).filter(i => i) as MetaObject[]
        const sortMetas = calculateSortObjects(allMetas, currentView.sort)
        const sortMetaIds = sortMetas.map(i => i.id)
        const idToIndexMap = new Map(sortMetaIds.map((i, idx) => [i, idx]))
        afterSearchValue.sort((b, a) => {
          const bIdx = idToIndexMap.get(b.id) || 0
          const aIdx = idToIndexMap.get(a.id) || 0
          return bIdx - aIdx
        })
      }
      const itemPosition: Record<number, number> = {}
      afterSearchValue.forEach((c, idx) => {
        itemPosition[c.rowId] = idx
      })
      const copyed = groupData.values.filter(i => itemPosition[i.rowId] !== undefined)
      copyed.sort((a, b) => itemPosition[a.rowId] - itemPosition[b.rowId])
      setGroupState(s => ({ ...s, filterValues: copyed, viewValues: viewValues }))
    }
  }, [currentView?.filter, currentView?.search, currentView?.sort, currentView?.valueIndex])
}

export default useGroupFilter
