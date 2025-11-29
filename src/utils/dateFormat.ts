import {
  isToday,
  isYesterday,
  formatRelative,
  isThisYear,
  format,
  formatDistanceToNow,
  getWeekOfMonth,
  formatDistanceToNowStrict,
  differenceInDays
} from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import i18next from 'i18next'
import { normalizeSecondsToTime } from '@/core/components/media/utils'

const zhRelativeLocale = {
  yesterday: "'昨天'",
  today: "'今天'"
}
const enRelativeLocale = {
  yesterday: "'Yesterday'",
  today: "'Today'"
}
const getLocale = () => {
  const lang = i18next.language
  if (lang === 'zh-CN') {
    return {
      ...zhCN,
      formatRelative: (t, d, b, o) => zhRelativeLocale[t] || zhCN.formatRelative(t, d, b, o)
    }
  } else {
    return {
      ...enUS,
      formatRelative: (t, d, b, o) => enRelativeLocale[t] || enUS.formatRelative(t, d, b, o)
    }
  }
}

function ordinal_suffix_of(i: number) {
  let j = i % 10,
    k = i % 100
  if (j === 1 && k !== 11) {
    return i + 'st'
  }
  if (j === 2 && k !== 12) {
    return i + 'nd'
  }
  if (j === 3 && k !== 13) {
    return i + 'rd'
  }
  return i + 'th'
}

export const ChineseFormats = {
  yearMonths: 'y年M月',
  yearMonthDays: 'y年M月d日',
  yearMonthWeeks: 'y年M月第w周',
  year: 'y年',
  monthDays: 'M月d日'
}
export const EnglishFormats = {
  yearMonths: 'MMM y',
  yearMonthDays: 'MMMM d, y',
  yearMonthWeeks: 'wo week of MMM, y',
  year: 'y',
  monthDays: 'MMMM d'
}
export const DateFormat = {
  getLocale,
  format: (date: number | Date, f: string) =>
    format(date, f, {
      locale: getLocale()
    }),
  // seconds
  formatDuration: (duration: number) => {
    return normalizeSecondsToTime(duration)
  },
  formatTime: (
    date: number | string | Date,
    opts?: {
      thisYearShowYear?: boolean
      showMinute?: boolean
    }
  ) => {
    const time = new Date(date)
    const diffDays = differenceInDays(new Date(), time)
    if (diffDays < 7) {
      return DateFormat.formatDistanceToNowStrict(time.getTime(), true)
    }
    if (time.getFullYear() !== new Date().getFullYear()) {
      return `${DateFormat.format(time, DateFormat.Formats.yearMonthDays)}${opts?.showMinute ? ` ${DateFormat.format(time, DateFormat.Formats.minute)}` : ''}`
    }
    return `${DateFormat.format(time, opts?.thisYearShowYear ? DateFormat.Formats.yearMonthDays : DateFormat.Formats.monthDays)}${opts?.showMinute ? ` ${DateFormat.format(time, DateFormat.Formats.minute)}` : ''}`
  },
  formatWeekOfMonth: (date: number) => {
    const lang = i18next.language
    const week = getWeekOfMonth(date, { weekStartsOn: 1 })
    console.log(new Date(date), week)
    const yearMonths = DateFormat.format(date, DateFormat.Formats.yearMonths)
    if (lang === 'zh-CN') {
      return yearMonths + `第${week}周`
    } else {
      return `${ordinal_suffix_of(week)} week of ` + yearMonths
    }
  },
  getWeekOfMonth: (dateNum: number) => {
    const date = new Date(dateNum)
    let adjustedDate = date.getDate() + date.getDay()
    let prefixes = ['0', '1', '2', '3', '4', '5']
    return parseInt(prefixes[0 | (adjustedDate / 7)]) + 1
  },
  formatDistanceToNow: (date: number, suffix?: boolean) =>
    formatDistanceToNow(date, {
      locale: getLocale(),
      addSuffix: suffix
    }),
  formatDate: (date: number | string, compact?: boolean) => {
    const d = new Date(date)
    if (isToday(d)) {
      return formatRelative(d, new Date(), {
        locale: getLocale()
      })
    }
    if (isYesterday(d)) {
      return formatRelative(d, new Date(), {
        locale: getLocale()
      })
    }
    if (isThisYear(d)) {
      if (compact) {
        return DateFormat.format(d.getTime(), 'MM-dd')
      }
      return DateFormat.format(d.getTime(), DateFormat.Formats.monthDays)
    } else {
      if (compact) {
        return DateFormat.format(d.getTime(), 'yyyy-MM')
      }
      return DateFormat.format(d.getTime(), DateFormat.Formats.yearMonthDays)
    }
  },
  formatDistanceToNowStrict: (date: number, suffix = false) => formatDistanceToNowStrict(date, { locale: getLocale(), addSuffix: suffix }),
  Formats: {
    default: 'y/M/d',
    withMinute: 'y/M/d H:mm',
    withSecond: 'y/M/d H:mm:ss',
    minute: 'H:mm',
    weekday: 'EEE',
    yearMonthDays: EnglishFormats.yearMonthDays,
    yearMonths: EnglishFormats.yearMonths,
    yearMonthWeeks: EnglishFormats.yearMonthWeeks,
    year: EnglishFormats.year,
    monthDays: EnglishFormats.monthDays
  }
}
export default DateFormat
