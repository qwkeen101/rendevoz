import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import { useMemo, useRef } from 'react'
import { MetaGroup, MetaObject } from '~/typings'
import { calculateFilterObjects } from '@/core/object/filter/useBetterFilter'
import fuzzysort from 'fuzzysort'
import { calculateSortObjects } from '@/core/object/filter/BetterSorter'
import { atom, useAtom, useSetAtom } from 'jotai'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { selectAtom } from 'jotai/utils'

const useGroupFilter = (groupData?: MetaGroup) => {
  const metaMap = MetaStore.useMetaObjectsMap()
  const setGroupState = useSetAtom(GroupStateAtom)
  const searchable = useMemo(() => {
    const map = metaMap
    const tagMap = globalStore.get(ObjectStore('tag').objectMapAtom)
    const optionMap = globalStore.get(ObjectStore('metaPropSelectOption').objectMapAtom)
    return groupData?.values
      ?.map(i => {
        const meta = map.get(i.id)
        if (!meta) return
        let search = `${meta.name}, ${meta.description}`
        const tags = meta.tags?.map(i => tagMap.get(i)?.name || '').join(',')
        search += `,${tags}`
        if (meta.properties) {
          Object.entries(meta.properties).forEach(([k, i]) => {
            const propDetails = MetaStore.getPropDetails(k)
            if (propDetails) {
              switch (propDetails.propType) {
                case 'string':
                case 'AI summary':
                  if (i.value) {
                    search += ',' + i.value
                  }
                  break
                case 'number':
                  if (i.value !== undefined) {
                    search += ',' + i.value
                  }
                  break
                case 'URL':
                  if (i.value !== undefined) {
                    search += ',' + i.value
                  }
                  break
                case 'singleSelect':
                  if (i.value) {
                    search += ',' + optionMap.get(i.value)?.name
                  }
                  break
                case 'multiSelect':
                  if (i.value?.length) {
                    i.value.forEach(id => {
                      search += ',' + optionMap.get(id)?.name
                    })
                  }
                  break
              }
            }
          })
        }
        return {
          name: meta.name,
          searchable: search,
          rowId: i.rowId
        }
      })
      .filter(i => i) as any[]
  }, [groupData?.values, metaMap])
  const latestSearchable = useRef(searchable)
  latestSearchable.current = searchable
  const subAtom = useMemo(() => {
    const filterAtom = selectAtom(GroupStateAtom, s => s.currentView?.filter)
    const searchAtom = selectAtom(GroupStateAtom, s => s.currentView?.search)
    const sortAtom = selectAtom(GroupStateAtom, s => s.currentView?.sort)
    const valueIndexAtom = selectAtom(GroupStateAtom, s => s.currentView?.valueIndex)
    const valuesAtom = selectAtom(GroupStateAtom, s => s.data?.values)

    return atom(get => {
      const searchable = latestSearchable.current
      const filter = get(filterAtom)
      const search = get(searchAtom)
      const sort = get(sortAtom)
      const valueIndex = get(valueIndexAtom)
      const values = get(valuesAtom)
      if (values && valueIndex) {
        console.log('calculate filter here')
        // display by value index
        const index = valueIndex || []
        const itemPos: Record<number, number> = {}
        index.forEach((i, idx) => {
          itemPos[i] = idx
        })
        let viewValues = values.slice()
        viewValues.sort((a, b) => itemPos[a.rowId] - itemPos[b.rowId])
        if (!filter?.rules.length && !search?.length && !sort?.sorters.length) {
          setGroupState(s => ({ ...s, viewValues: viewValues, filterValues: undefined }))
          return
        }
        const currentValue = values
        const map = MetaStore.getMetaObjectsMap()
        const allRows = currentValue
        const firstLayerMetaIds = allRows.filter(i => i.id).map(i => i.id) as number[]
        const afterFilterExistMetaIds = new Set([
          ...(filter?.rules.length ? calculateFilterObjects(filter, firstLayerMetaIds, true)?.map(i => i.id) || [] : firstLayerMetaIds)
        ])
        const afterFilterRows = allRows.filter(i => {
          if (i.type === 'metaObject') {
            return afterFilterExistMetaIds.has(i.id)
          }
          return false
        })
        const afterFilterRowIds = new Set(afterFilterRows.map(i => i.rowId))
        let afterSearchValue = afterFilterRows

        if (search && searchable) {
          const replaced = search.replaceAll(',', '')
          if (replaced) {
            const result = fuzzysort.go(
              search,
              searchable.filter(i => afterFilterRowIds.has(i.rowId)),
              {
                key: 'searchable',
                threshold: -400000
              }
            )
            // todo: search rank
            const afterSearchRowIds = new Set(Array.from(result.values()).map(i => i.obj.rowId))
            afterSearchValue = afterFilterRows.filter(i => afterSearchRowIds.has(i.rowId))
          }
        }
        if (sort?.sorters.length) {
          const allMetas = afterSearchValue.map(i => i.type === 'metaObject' && map.get(i.id)).filter(i => i) as MetaObject[]
          const sortMetas = calculateSortObjects(allMetas, sort)
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

        const filtered = values.filter(i => itemPosition[i.rowId] !== undefined)
        // no sort, sort by valueIndex
        if (!sort?.sorters.length) {
          filtered.sort((a, b) => itemPos[a.rowId] - itemPos[b.rowId])
        } else {
          filtered.sort((a, b) => itemPosition[a.rowId] - itemPosition[b.rowId])
        }
        setGroupState(s => ({ ...s, filterValues: filtered, viewValues: viewValues }))
      }
    })
  }, [])
  useAtom(subAtom)
}

export default useGroupFilter
