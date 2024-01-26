import { MetaGroupChild, MetaObject } from '~/typings'
import { MetaStore } from '@/api/stores'
import { DateGroupRule, SelectGroupRule } from '~/typings/components/group/property-group'
import { IGroupGrouper } from '@/core/components/group/hooks/useGroupState'
import Id from '@/utils/id'
import { sub, getWeekOfMonth, startOfWeek } from 'date-fns'
import groupBy from '@/core/components/group/hooks/grouper/calculator/groupBy'
import { EMPTY_GROUPER_NAME } from '@/core/components/group/hooks/grouper/useBuildGrouper'
import getRelativeDate from '@/core/components/group/hooks/grouper/calculator/getRelativeDate'
import { DateFormat } from '@/utils'

export type relativeDates = 'last30days' | 'last7days' | 'yesterday' | 'today' | 'tomorrow' | 'next7days' | 'next30days' | string

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
      property: metaMap.has(i.id) ? property(metaMap.get(i.id)!) ?? EMPTY_GROUPER_NAME : undefined
    }))
    .filter(i => i.meta)
  let result = {}
  const now = new Date()
  now.setSeconds(0)
  now.setHours(0)
  now.setMinutes(0)
  const getKeyFunc = (date: Date) => {
    date.setSeconds(0)
    date.setMinutes(0)
    date.setHours(0)
    switch (rule.dateBy) {
      case 'day': {
        return date.getTime()
      }
      case 'month': {
        date.setDate(1)
        return date.getTime()
      }
      case 'relative': {
        return getRelativeDate(date, now)
      }
      case 'week': {
        const start = startOfWeek(date, { weekStartsOn: 1 })
        if (start.getMonth() !== date.getMonth()) {
          date.setDate(1)
          return date.getTime()
        }
        return start.getTime()
      }
      case 'year': {
        date.setDate(1)
        date.setMonth(0)
        return date.getTime()
      }
    }
  }
  result = groupBy(valueWithMetas, v => {
    return typeof v.property === 'number' ? getKeyFunc(new Date(v.property)) : EMPTY_GROUPER_NAME
  })
  const groupers = Object.entries(result).map(i => ({ id: Id.getId(), name: i[0], values: i[1].map(o => o.value), visible: true }))

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
