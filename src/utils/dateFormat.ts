import { format, formatDistance, formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import i18next from 'i18next'

const getLocale = () => {
  const lang = i18next.language
  if (lang === 'zh-CN') {
    return zhCN
  } else {
    return enUS
  }
}
const DateFormat = {
  format: (date: number | Date, f: string) => format(date, f),
  formatDistanceToNow: (date: number) => formatDistanceToNow(date),
  formatDistanceToNowStrict: (date: number) => formatDistanceToNowStrict(date, { locale: getLocale() }),
  Formats: {
    default: 'Y/M/d',
    withMinute: 'Y/M/d H:mm'
  }
}

export default DateFormat
