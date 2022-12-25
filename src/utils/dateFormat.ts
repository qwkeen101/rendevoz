import { format, formatDistance, formatDistanceToNow } from 'date-fns'

const DateFormat = {
  format: (date: number, f: string) => format(date, f),
  formatDistanceToNow: (date: number) => formatDistanceToNow(date),
  Formats: {
    default: 'Y/M/d'
  }
}

export default DateFormat
