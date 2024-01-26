import { DateGroupRule } from '~/typings/components/group/property-group'
import { relativeDates } from '@/core/components/group/hooks/grouper/calculator/date'
import { parse } from 'date-fns'
import { DateFormat } from '@/utils'
export default (groupRule: DateGroupRule, groupName: string): number => {
  const name = groupName as relativeDates
  const parsed = Number(groupName)
  console.log(parsed)
  if (typeof parsed === 'number') {
    const monthFirstDate = new Date(parsed)
    monthFirstDate.setSeconds(0)
    monthFirstDate.setMinutes(0)
    monthFirstDate.setHours(0)
    monthFirstDate.setDate(1)
    return monthFirstDate.getTime()
  }
  const now = new Date()
  now.setHours(0)
  now.setMinutes(0)
  now.setSeconds(0)
  switch (name) {
    case 'today': {
      return now.getTime()
    }
    case 'yesterday': {
      now.setDate(now.getDate() - 1)
      return now.getTime()
    }
    case 'tomorrow': {
      now.setDate(now.getDate() + 1)
      return now.getTime()
    }
    case 'last30days': {
      now.setDate(now.getDate() - 30)
      return now.getTime()
    }
    case 'last7days': {
      now.setDate(now.getDate() - 7)
      return now.getTime()
    }
    case 'next30days': {
      now.setDate(now.getDate() + 30)
      return now.getTime()
    }
    case 'next7days': {
      now.setDate(now.getDate() + 7)
      return now.getTime()
    }
  }
}
