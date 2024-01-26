import { relativeDates } from '@/core/components/group/hooks/grouper/calculator/date'
import { intervalToDuration, interval, format } from 'date-fns'
import { DateFormat } from '@/utils'
export default (date: Date, now: Date): relativeDates => {
  const inter = interval(date, now)
  const duration = intervalToDuration(inter)
  console.log(duration, date)
  if (duration.days === undefined && duration.months === undefined && duration.weeks === undefined && duration.years === undefined) {
    if (duration.hours !== undefined) {
      if (duration.hours > 0) {
        return 'yesterday'
      }
      if (duration.hours < 0) {
        return 'tomorrow'
      }
    }
    return 'today'
  }
  if (duration.days !== undefined && duration.months === undefined && duration.years === undefined) {
    if (duration.days === 1) {
      return 'yesterday'
    }
    if (duration.days <= 7 && duration.days > 0) {
      return 'last7days'
    }
    if (duration.days <= 30 && duration.days > 0) {
      return 'last30days'
    }
    if (duration.days < 0 && duration.days >= -7) {
      return 'next7days'
    }
    if (duration.days < 0 && duration.days >= -30) {
      return 'next30days'
    }
  }
  date.setDate(1)
  return String(date.getTime())
}
