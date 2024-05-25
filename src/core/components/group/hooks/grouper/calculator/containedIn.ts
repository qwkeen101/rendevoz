import { MetaGroupChild, MetaObject } from '~/typings'
import { IGroupGrouper } from '@/core/components/group/hooks/useGroupState'
import { MetaStore } from '@/api/stores'
import calculateAppearIn, { AppearIn } from '@/core/search/calculateAppearIn'
import groupBy from '@/core/components/group/hooks/grouper/calculator/groupBy'
import { EMPTY_GROUPER_NAME } from '@/core/components/group/hooks/grouper/useBuildGrouper'
import Id from '@/utils/id'

export default async function containedInGroupCaculator(values: MetaGroupChild[], existedGroupers?: IGroupGrouper[]) {
  const metaMap = MetaStore.getMetaObjectsMap()
  const valueWithMetas = values
    .map(i => ({
      value: i,
      meta: metaMap.get(i.id)
    }))
    .filter(i => i.meta)
  const appears = await calculateAppearIn(valueWithMetas.map(i => i.meta!.id))
  const groups: {
    parent: MetaObject
    children: Set<number>
  }[] = []
  Object.values(appears).forEach(a => {
    a.forEach(m => {
      if (m.children.length) {
        groups.push({
          parent: m.parent,
          children: new Set(m.children.map(i => i.id))
        })
      }
    })
  })
  const grouped = groupBy(valueWithMetas, o => {
    const targetGroups = groups.filter(i => i.children.has(o.meta!.id))
    if (targetGroups.length) {
      return targetGroups.map(i => i.parent.id)
    }
    return EMPTY_GROUPER_NAME
  })
  const groupers: IGroupGrouper[] = Object.entries(grouped).map(i => ({
    id: Id.getId(),
    name: i[0],
    values: i[1].map(o => o.value),
    visible: true
  }))
  if (existedGroupers) {
    const existed = Object.fromEntries(existedGroupers?.map(i => [i.name, i]))
    console.log(existed, groupers)
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
