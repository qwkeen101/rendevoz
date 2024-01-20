import { MetaGroupChild, MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { NumberGroupRule } from '~/typings/components/group/property-group'
import { IGroupGrouper } from '@/core/components/group/hooks/useGroupState'
import Id from '@/utils/id'
import groupBy from '@/core/components/group/hooks/grouper/calculator/groupBy'

export default function numberGroupCalculator(
  values: MetaGroupChild[],
  property: (o: MetaObject) => number,
  rule: NumberGroupRule,
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
  const range = rule.groupRange
  const step = rule.groupEvery
  const result = groupBy(valueWithMetas, i => {
    return step >= 1 ? Math.floor((i.property as number) / step) : (i.property as number) / step
  })
  if (step !== 1) {
    Object.keys(result).forEach(i => {
      result[Number(i) * step] = result[i]
      delete result[i]
    })
  }
  console.log(result)
}
