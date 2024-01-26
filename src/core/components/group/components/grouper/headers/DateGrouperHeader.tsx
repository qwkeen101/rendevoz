import { DateGroupRule } from '~/typings/components/group/property-group'
import { DateFormat } from '@/utils'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export default memo(({ rule, value }: { rule: DateGroupRule; value: string }) => {
  const num = Number(value)
  const { t } = useTranslation()
  if (rule.dateBy === 'relative') {
    if (Number.isNaN(num)) {
      return <div>{t(`general.${value}`)}</div>
    }
    return <div>{DateFormat.format(num, DateFormat.Formats.yearMonths)}</div>
  }
  if (Number.isNaN(num)) return null
  if (rule.dateBy === 'day') {
    return <div>{DateFormat.format(num, DateFormat.Formats.yearMonthDays)}</div>
  }
  if (rule.dateBy === 'month') {
    return <div>{DateFormat.format(num, DateFormat.Formats.yearMonths)}</div>
  }
  if (rule.dateBy === 'week') {
    return <div>{DateFormat.formatWeekOfMonth(num)}</div>
  }
  if (rule.dateBy === 'year') {
    return <div>{DateFormat.format(num, DateFormat.Formats.year)}</div>
  }
})
