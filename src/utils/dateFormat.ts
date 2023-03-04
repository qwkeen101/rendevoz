import { format, formatDistance, formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
const DateFormat = {
  format: (date: number | Date, f: string) => format(date, f),
  formatDistanceToNow: (date: number) => formatDistanceToNow(date),
  formatDistanceToNowStrict: (date: number) => formatDistanceToNowStrict(date, { locale: zhCN }),
  Formats: {
    default: 'Y/M/d',
    withMinute: 'Y/M/d H:mm'
  }
}

export default DateFormat
