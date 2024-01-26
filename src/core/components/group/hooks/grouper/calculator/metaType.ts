import { MetaGroupChild, MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { MetaTypeGroupRule } from '~/typings/components/group/property-group'
import { IGroupGrouper } from '@/core/components/group/hooks/useGroupState'
import Id from '@/utils/id'
import groupBy from '@/core/components/group/hooks/grouper/calculator/groupBy'
import { EMPTY_GROUPER_NAME } from '@/core/components/group/hooks/grouper/useBuildGrouper'
import DEFAULT_GROUPER from '@/core/components/group/components/grouper/consts/DEFAULT_GROUPER'

export const GROUPER_DEFAULT_GROUP_EVERY = DEFAULT_GROUPER.GROUP_EVERY
export const GROUPER_DEFAULT_GROUP_RANGE = DEFAULT_GROUPER.GROUP_RANGE

export default function metaTypeGroupCalculator(
  values: MetaGroupChild[],
  property: (o: MetaObject) => MetaObject['type'],
  rule: MetaTypeGroupRule,
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
  let result = groupBy(valueWithMetas, i => {
    if (typeof i.property === 'string' && i.property === EMPTY_GROUPER_NAME) {
      return EMPTY_GROUPER_NAME
    }
    return i.property || EMPTY_GROUPER_NAME
  })
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
