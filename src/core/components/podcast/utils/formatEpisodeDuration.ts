import { formatDuration, intervalToDuration } from 'date-fns'
import { DateFormat } from '@/utils'

export default (dur: number) => {
  return formatDuration(intervalToDuration({ start: 0, end: dur * 1000 }), {
    locale: DateFormat.getLocale(),
    format: ['hours', 'minutes']
  })
    .replace(' seconds', 's')
    .replace(' second', 's')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
}
