import { MetaGroupChild, MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { NumberGroupRule } from '~/typings/components/group/property-group'
import { IGroupGrouper } from '@/core/components/group/hooks/useGroupState'
import Id from '@/utils/id'
import groupBy from '@/core/components/group/hooks/grouper/calculator/groupBy'
import { EMPTY_GROUPER_NAME } from '@/core/components/group/hooks/grouper/useBuildGrouper'
import DEFAULT_GROUPER from '@/core/components/group/components/grouper/consts/DEFAULT_GROUPER'

export const GROUPER_DEFAULT_GROUP_EVERY = DEFAULT_GROUPER.GROUP_EVERY
export const GROUPER_DEFAULT_GROUP_RANGE = DEFAULT_GROUPER.GROUP_RANGE

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
      property: metaMap.has(i.id) ? property(metaMap.get(i.id)!) ?? EMPTY_GROUPER_NAME : undefined
    }))
    .filter(i => i.meta && i.property !== undefined)
  const range = rule.groupRange
  const step = (rule.groupEvery === 0 ? 1 : rule.groupEvery) ?? GROUPER_DEFAULT_GROUP_EVERY
  console.log(range, step)
  let result = groupBy(valueWithMetas, i => {
    console.log(i)
    if (typeof i.property === 'string' && i.property === EMPTY_GROUPER_NAME) {
      return EMPTY_GROUPER_NAME
    }
    if (typeof i.property === 'number') {
      if (i.property > (range.to ?? GROUPER_DEFAULT_GROUP_RANGE.to) || i.property < (range.from ?? GROUPER_DEFAULT_GROUP_RANGE.from)) {
        return 'outOfRange'
      }
    }
    if (i.property !== undefined) return step >= 1 ? Math.floor((i.property as number) / step) : (i.property as number) / step
  })
  console.log(result)
  if (step !== 1) {
    const clonedObject = { ...result }
    const deletedKeys: Set<string> = new Set()
    Object.keys(result).forEach(i => {
      const num = Number(i)
      if (!Number.isNaN(num) && num !== 0) {
        clonedObject[num * step] = result[i]
        deletedKeys.add(i)
      }
    })
    Object.keys(result).forEach(i => {
      const num = Number(i)
      if (!Number.isNaN(num)) {
        deletedKeys.delete(String(num * step))
      }
    })
    deletedKeys.forEach(key => {
      delete clonedObject[key]
    })
    result = clonedObject
  }

  const existed = existedGroupers && Object.fromEntries(existedGroupers.map(i => [i.name, i]))
  const final: IGroupGrouper[] = Object.entries(result).map(i => ({
    id: Id.getId(),
    name: i[0],
    visible: true,
    values: i[1].map(i => i.value)
  }))
  if (existed) {
    final.forEach(i => {
      if (existed[i.name]) {
        existed[i.name].values = i.values
      } else {
        existed[i.name] = i
      }
    })
    Object.keys(existed).forEach(k => {
      if (!final.some(o => o.name === k)) {
        delete existed[k]
      }
    })
    return Object.values(existed)
  } else {
    return final
  }
}
