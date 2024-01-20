import { MetaGroupChild, MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { DateGroupRule } from '~/typings/components/group/property-group'
import { IGroupGrouper } from '@/core/components/group/hooks/useGroupState'
import Id from '@/utils/id'
import groupBy from '@/core/components/group/hooks/grouper/calculator/groupBy'

export default function dateGroupCalculator(
  values: MetaGroupChild[],
  property: (o: MetaObject) => number | number[],
  rule: DateGroupRule,
  existedGroupers?: IGroupGrouper[]
) {
  const metaMap = MetaStore.getMetaObjectsMap()
  const valueWithMetas = values
    .map(i => ({
      value: i,
      meta: metaMap.get(i.id),
      property: metaMap.has(i.id) ? property(metaMap.get(i.id)!) : undefined
    }))
    .filter(i => i.meta && i.property !== undefined)
  const result = groupBy(valueWithMetas, v => {
    return v.property as number | number[]
  })
  console.log(result)
}
