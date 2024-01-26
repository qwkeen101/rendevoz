import { MetaGroupChild, MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { StringGroupRule } from '~/typings/components/group/property-group'
import { IGroupGrouper } from '@/core/components/group/hooks/useGroupState'
import Id from '@/utils/id'
import groupBy from '@/core/components/group/hooks/grouper/calculator/groupBy'
import { EMPTY_GROUPER_NAME } from '@/core/components/group/hooks/grouper/useBuildGrouper'

export default function stringGroupCalculator(
  values: MetaGroupChild[],
  property: (o: MetaObject) => string,
  rule: StringGroupRule,
  existedGroupers?: IGroupGrouper[]
) {
  const metaMap = MetaStore.getMetaObjectsMap()
  const valueWithMetas = values
    .map(i => ({
      value: i,
      meta: metaMap.get(i.id),
      property: metaMap.has(i.id) ? property(metaMap.get(i.id)!) : ''
    }))
    .filter(i => i.meta)
  let result: Record<string, { value: MetaGroupChild; meta: MetaObject; property: string }[]> = {}
  if (rule.textBy === 'exact') {
    result = groupBy(valueWithMetas, v => {
      return v.property
    })
  }
  if (rule.textBy === 'alphabetical') {
    result = groupBy(valueWithMetas, v => {
      return v.property === EMPTY_GROUPER_NAME ? EMPTY_GROUPER_NAME : v.property[0]
    })
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
