import { globalStore, MetaStore, ObjectStore } from '@/stores'
import { useEffect, useMemo } from 'react'
import { MetaGroup } from '~/typings'
import { calculateFilterObjects } from '@/core/object/filter/useBetterFilter'
import fuzzysort from 'fuzzysort'
import { calculateSortObjects } from '@/core/object/filter/BetterSorter'

const useGroupFilter = (groupId: number) => {
  const groupData = ObjectStore('group').useValue(groupId) as MetaGroup | undefined
  const searchable = useMemo(() => {
    const map = MetaStore.getMetaObjectsMap()
    const tagMap = globalStore.get(ObjectStore('tag').objectMapAtom)
    return groupData?.value?.map(i => {
      if (i.type !== 'metaObject') {
        return
      }
      const meta = map.get(i.id)
      if (!meta) return
      const tags = meta.tags?.map(i => tagMap.get(i)?.name || '').join('$')
      const from = meta.fromObject ? map.get(meta.fromObject.metaId)?.name : undefined
      return {
        name: meta.name,
        description: meta.description,
        tags,
        id: meta.id,
        from
      }
    })
  }, [groupData?.value])
  useEffect(() => {
    if (!groupData?.filter?.rules.length && !groupData?.search?.length && !groupData?.sort?.sorters.length && groupData?.afterFilterValue) {
      ObjectStore('group').updateOne({ id: groupId, afterFilterValue: undefined })
      return
    }
    // if (groupData?.value) {
    //   const currentValue = groupData.value
    //   const map = MetaStore.getMetaObjectsMap()
    //   const metaRows = currentValue.filter(i => i.type === 'metaObject')
    //   const firstLayerMetaIds = metaRows.map(i => i.id) as number[]
    //   const afterFilterExistMetaIds = new Set([
    //     ...(groupData.filter?.rules.length
    //       ? calculateFilterObjects(groupData.filter, firstLayerMetaIds)?.map(i => i.id) || []
    //       : firstLayerMetaIds)
    //   ])
    //   const afterFilterMetaRows = metaRows.filter(i => afterFilterExistMetaIds.has(i.id))
    //   let afterSearchValue = afterFilterMetaRows
    //   // const filteredIds = new Set(afterFilterValue.map(i => i))
    //   // if (groupData.search && searchable) {
    //   //   const result = fuzzysort.go(
    //   //     groupData.search,
    //   //     searchable.filter(i => i && filteredIds.has(i?.id)),
    //   //     {
    //   //       keys: ['name', 'description', 'tags', 'from'],
    //   //       threshold: -400000
    //   //     }
    //   //   )
    //   //   afterSearchValue = Array.from(result.values()).map(i => i.obj.id)
    //   // }
    //   const afterSortValue = groupData.sort
    //     ? calculateSortObjects(
    //         afterSearchValue.map(i => map.get(i)).filter(i => i),
    //         groupData.sort
    //       ).map(i => i.id)
    //     : afterSearchValue
    //   ObjectStore('group').updateOne({
    //     id: groupId,
    //     afterFilterValue: afterSortValue.map(i => ({
    //       type: 'metaObject',
    //       id: i
    //     }))
    //   })
    // }
  }, [groupData?.filter, groupData?.search, groupData?.sort, groupData?.value])
}

export default useGroupFilter
