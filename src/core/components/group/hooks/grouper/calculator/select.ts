import { MetaGroupChild, MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { SelectGroupRule } from '~/typings/components/group/property-group'
import { IGroupGrouper } from '@/core/components/group/hooks/useGroupState'
import Id from '@/utils/id'
import groupBy from '@/core/components/group/hooks/grouper/calculator/groupBy'
import { EMPTY_GROUPER_NAME } from '@/core/components/group/hooks/grouper/useBuildGrouper'

export default function selectGroupCalculator(
  values: MetaGroupChild[],
  property: (o: MetaObject) => number | number[],
  rule: SelectGroupRule,
  existedGroupers?: IGroupGrouper[]
) {
  const metaMap = MetaStore.getMetaObjectsMap()
  const valueWithMetas = values
    .map(i => ({
      value: i,
      meta: metaMap.get(i.id),
      property: metaMap.has(i.id) ? property(metaMap.get(i.id)!) || EMPTY_GROUPER_NAME : undefined
    }))
    .filter(i => i.meta)
  const result = groupBy(valueWithMetas, v => {
    return v.property as number | number[]
  })

  const groupers = Object.entries(result).map(i => ({ id: Id.getId(), name: i[0], values: i[1].map(o => o.value), visible: true }))
  console.log(groupers)
  if (existedGroupers) {
    const existed = Object.fromEntries(existedGroupers?.map(i => [i.name, i]))
    groupers.forEach(g => {
      if (existed[g.name]) {
        existed[g.name].values = g.values
      } else {
        existed[g.name] = g
      }
    })
    Object.keys(existed).forEach(k => {
      if (!groupers.some(o => o.name === k)) {
        delete existed[k]
      }
    })
    return Object.values(existed)
  } else {
    return groupers
  }
}
