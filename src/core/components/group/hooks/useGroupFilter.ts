import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MetaGroup, MetaObject } from '~/typings'
import { calculateFilterObjects } from '@/core/object/filter/useBetterFilter'
import fuzzysort from 'fuzzysort'
import { calculateSortObjects } from '@/core/object/filter/BetterSorter'
import { atom, useAtom, useSetAtom } from 'jotai'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { selectAtom } from 'jotai/utils'
import { useSelectAtomValue } from '@/hooks'
import { isEqual } from 'lodash'
import calculateContains from '@/core/object/objectList/calculateContains'

const useGroupFilter = (groupData?: MetaGroup) => {
  const metaMap = MetaStore.useMetaObjectsMap()
  const setGroupState = useSetAtom(GroupStateAtom)
  const currentView = useSelectAtomValue(GroupStateAtom, s => s.currentView)
  const [searchable, setSearchable] = useState<
    {
      name: string
      searchable: string
      rowId: number
    }[]
  >([])
  const getSearchable = async () => {
    const map = metaMap
    const tagMap = globalStore.get(ObjectStore('tag').objectMapAtom)
    const optionMap = globalStore.get(ObjectStore('metaPropSelectOption').objectMapAtom)
    const showOriginalText = currentView?.options.properties?.[6].visible === true
    const result = (
      await Promise.all(
        (groupData?.values || []).map(async i => {
          const meta = map.get(i.id)
          if (!meta) return
          let search = `${meta.name}, ${meta.description}, ${meta.placeholderName}`
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
          if (showOriginalText) {
            const original = await ObjectStore(meta.type).fetchOneById(meta.objectId)
            if (original && 'selectedText' in original) {
              search += original.selectedText
            }
          }
          return {
            name: meta.name || meta.placeholderName,
            searchable: search,
            rowId: i.rowId
          }
        })
      )
    ).filter(i => i)
    setSearchable(result)
  }
  useEffect(() => {
    getSearchable()
  }, [groupData?.values, metaMap, currentView?.options.properties])
  const latestSearchable = useRef(searchable)
  latestSearchable.current = searchable
  const subAtom = useMemo(() => {
    const trackAtom = selectAtom(
      GroupStateAtom,
      s => ({
        filter: s.currentView?.filter,
        search: s.currentView?.search,
        sort: s.currentView?.sort,
        valueIndex: s.currentView?.valueIndex,
        values: s.data?.values,
        contains: s.currentView?.selectedContainsMeta
      }),
      isEqual
    )
    return atom(get => {
      const { filter, search, sort, contains, valueIndex, values } = get(trackAtom)
      const searchable = latestSearchable.current
      const action = async () => {
        if (values && valueIndex) {
          // display by value index
          const index = valueIndex || []
          const itemPos: Record<number, number> = {}
          index.forEach((i, idx) => {
            itemPos[i] = idx
          })
          let showTemp = false
          let currentValue = values.slice()
          if (contains?.length) {
            showTemp = true
            const rest = (
              await Promise.all(
                contains.map(async i => {
                  const m = MetaStore.getCachedMetaObject(i)
                  if (m && !m.deleted) {
                    return calculateContains(m)
                  }
                })
              )
            )
              .filter(i => i)
              .flat() as MetaObject[]
            const ids = new Set(rest.map(i => i.id))
            currentValue = currentValue.filter(i => ids.has(i.id))
          }
          if (showTemp === false) {
            currentValue = currentValue.filter(i => {
              if (i.type === 'metaObject') {
                const m = MetaStore.getCachedMetaObject(i.id)
                if (m?.temp) return false
                return true
              }
              return true
            })
          }
          currentValue.sort((a, b) => itemPos[a.rowId] - itemPos[b.rowId])
          if (!filter?.rules.length && !search?.length && !sort?.sorters.length) {
            setGroupState(s => ({ ...s, viewValues: currentValue, filterValues: undefined }))
            return
          }

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
          setGroupState(s => ({ ...s, filterValues: filtered, viewValues: currentValue }))
        }
      }
      action()
    })
  }, [])
  useAtom(subAtom)
}

export default useGroupFilter
