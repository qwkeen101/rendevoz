import { DateFormat } from '@/utils'

export default (d: string | number, year = false) => {
  const time = new Date(d)
  if (time.getFullYear() !== new Date().getFullYear()) {
    return DateFormat.format(time, DateFormat.Formats.yearMonthDays)
  }
  return DateFormat.format(time, year ? DateFormat.Formats.yearMonthDays : DateFormat.Formats.monthDays)
}
