import { format, formatDistance, formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns'

const DateFormat = {
  format: (date: number, f: string) => format(date, f),
  formatDistanceToNow: (date: number) => formatDistanceToNow(date),
  formatDistanceToNowStrict: (date: number) => formatDistanceToNowStrict(date),
  Formats: {
    default: 'Y/M/d',
    withMinute: 'Y/M/d H:mm'
  }
}

export default DateFormat
