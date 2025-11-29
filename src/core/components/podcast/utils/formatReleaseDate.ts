import { DateFormat } from '@/utils'
import { differenceInDays } from 'date-fns'

export default (d: string | number, year = false) => {
  const time = new Date(d)
  const diffDays = differenceInDays(new Date(), time)
  if (diffDays < 7) {
    return DateFormat.formatDistanceToNowStrict(time.getTime(), true)
  }
  if (time.getFullYear() !== new Date().getFullYear()) {
    return DateFormat.format(time, DateFormat.Formats.yearMonthDays)
  }
  return DateFormat.format(time, year ? DateFormat.Formats.yearMonthDays : DateFormat.Formats.monthDays)
}
