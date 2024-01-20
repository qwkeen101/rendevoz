import { MetaGroupChild, MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { StringGroupRule } from '~/typings/components/group/property-group'
import { IGroupGrouper } from '@/core/components/group/hooks/useGroupState'
import Id from '@/utils/id'

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
    result = valueWithMetas.reduce(
      (r, e) => {
        const v = e.property
        if (!r[v]) {
          r[v] = [e]
        } else {
          r[v].push(e)
        }
        return r
      },
      {} as Record<string, any[]>
    )
  }
  if (rule.textBy === 'alphabetical') {
    result = valueWithMetas.reduce(
      (r, e) => {
        const firstLetter = (e.property as string)[0]
        if (!r[firstLetter]) {
          r[firstLetter] = [e]
        } else {
          r[firstLetter].push(e)
        }
        return r
      },
      {} as Record<string, any[]>
    )
  }
  const existed = existedGroupers ? Object.fromEntries(existedGroupers, i => [i.name, i]) : {}
  const final: IGroupGrouper[] = []
  Object.entries(result).forEach(value => {
    if (existed[value[0]]) {
      const existGroup = existed[value[0]]
      existGroup.values = value[1].map(i => i.value.rowId)
      final.push(existGroup)
    } else {
      final.push({
        id: Id.getId(),
        name: value[0],
        values: value[1].map(i => i.value.rowId)
      })
    }
  })
  return final
}
