import { format, formatDistanceToNow, getWeekOfMonth, formatDistanceToNowStrict } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import i18next from 'i18next'

const getLocale = () => {
  const lang = i18next.language
  if (lang === 'zh-CN') {
    return zhCN
  } else {
    return enUS
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
  year: 'y年'
}
export const EnglishFormats = {
  yearMonths: 'MMM y',
  yearMonthDays: 'MMMM d, y',
  yearMonthWeeks: 'wo week of MMM, y',
  year: 'y'
}
export const DateFormat = {
  format: (date: number | Date, f: string) =>
    format(date, f, {
      locale: getLocale()
    }),
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
  formatDistanceToNow: (date: number) =>
    formatDistanceToNow(date, {
      locale: getLocale()
    }),
  formatDistanceToNowStrict: (date: number, suffix = false) => formatDistanceToNowStrict(date, { locale: getLocale(), addSuffix: suffix }),
  Formats: {
    default: 'y/M/d',
    withMinute: 'y/M/d H:mm',
    withSecond: 'y/M/d H:mm:ss',
    yearMonthDays: EnglishFormats.yearMonthDays,
    yearMonths: EnglishFormats.yearMonths,
    yearMonthWeeks: EnglishFormats.yearMonthWeeks,
    year: EnglishFormats.year
  }
}

export default DateFormat
