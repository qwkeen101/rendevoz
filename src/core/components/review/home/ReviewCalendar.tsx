import useReviewState from '@/core/components/review/useReviewState'
import { DateFormat } from '@/utils'
import { memo, useMemo, useState } from 'react'
import { addDays, eachMonthOfInterval, endOfYear, startOfDay, startOfToday, startOfWeek, startOfYear } from 'date-fns'
import classnames from 'classnames'
import { GlobalSetting } from '@/core'
import ToolTip from '@/components/base/Tooltip'
import { useTranslation } from 'react-i18next'

function getWeeksOfYear(year: number) {
  // 获取该年份的第一天和最后一天
  const startOfYearDate = startOfYear(new Date(year, 0)) // 1月1日
  const endOfYearDate = endOfYear(new Date(year, 11)) // 12月31日

  let weeks = []
  let currentDay = startOfYearDate
  // 遍历从年初到年末的每一天
  while (currentDay <= endOfYearDate) {
    // 将每周的开始设置为星期日
    let weekStart = startOfWeek(currentDay, { weekStartsOn: 0 }) // 设置星期日为一周的开始
    let week = []

    // 填充当前周，确保每周有7天
    for (let i = 0; i < 7; i++) {
      let dayOfWeek = addDays(weekStart, i)
      if (dayOfWeek >= currentDay && dayOfWeek <= endOfYearDate) {
        week.push(dayOfWeek) // 当前天属于这一周，加入具体日期
      } else {
        week.push(undefined) // 不属于这一周的部分，使用undefind填充
      }
    }

    weeks.push(week)
    currentDay = addDays(weekStart, 7) // 下一周的开始
  }

  return weeks
}
const getColors = (count: number, colors: string[]) => {
  const split = [0, 10, 20, 30, 40]
  let idx = split.findIndex(i => i >= count)
  if (idx < 0) {
    idx = colors.length - 1
  }
  return colors[idx]
}
export default memo(() => {
  const state = useReviewState()
  const darkMode = GlobalSetting.useSelectSettingAtom('darkMode')
  const calendar = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const weeks = getWeeksOfYear(currentYear)
    return weeks
  }, [])
  const months = useMemo(() => {
    const year = new Date().getFullYear()
    const start = startOfYear(new Date(year, 0)) // 获取该年的第一天
    const end = endOfYear(new Date(year, 0)) // 获取该年的最后一天
    const months = eachMonthOfInterval({ start, end })
    return months
  }, [])

  const colors = useMemo(() => {
    const darkBlue = ['rgba(50,50,50)', '#0e3444', '#00496d', '#2677a6', '#39afd3']
    const dark = ['rgba(50,50,50)', '#0e4429', '#006d32', '#26a641', '#39d353']
    const lightBlue = ['#ebedf0', '#9bd3e9', '#40a7c4', '#3090a1', '#4a879a']
    const light = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
    return {
      future: darkMode ? darkBlue : lightBlue,
      history: darkMode ? dark : light
    }
  }, [darkMode])
  const { t } = useTranslation()
  const getTooltip = (i: { due: number; review: number; date: Date; beforeToday: boolean }) => {
    if (i) {
      if ((i.beforeToday && i.review) || i.due) {
        return (
          <div className={'font-medium py-0.5'}>
            {i.beforeToday
              ? t('review.Cards studied on', {
                  date: DateFormat.format(i.date, DateFormat.Formats.monthDays),
                  num: i.review
                })
              : t('review.Cards scheduled on', {
                  num: i.due,
                  date: DateFormat.format(i.date, DateFormat.Formats.monthDays)
                })}
          </div>
        )
      }
    }
  }
  const all = useMemo(() => {
    const flatted = calendar.flat()
    const todayStart = startOfToday().getTime()
    return flatted.map(i => {
      if (i === undefined) return i
      const start = startOfDay(i).getTime()
      const beforeToday = start < todayStart
      const review = state.history[start]?.length ?? 0,
        due = state.futureDue[start]?.length ?? 0
      return {
        review: review,
        due: due,
        date: i,
        beforeToday,
        tooltip: getTooltip({
          beforeToday,
          due,
          review,
          date: i
        }),
        color: beforeToday ? getColors(review, colors.history) : getColors(due, colors.future)
      }
    })
  }, [state.history, state.futureDue, colors])

  const { review, due } = useMemo(() => {
    const result = {
      review: 0,
      due: 0
    }
    all.forEach(i => {
      if (i) {
        result.review += i.review
        result.due += i.due
      }
    })
    return result
  }, [all])
  return (
    <div className={'pt-1'}>
      <div
        className={'grid mb-2 transparent-font font-size-12 text-center'}
        style={{
          gridTemplateColumns: 'repeat(12, minmax(0,1fr))'
        }}
      >
        {months.map((i, idx) => (
          <div key={idx}>{DateFormat.format(i, 'MMM')}</div>
        ))}
      </div>
      <div
        className={'grid'}
        style={{
          gridTemplateColumns: `repeat(${calendar.length}, minmax(0,1fr))`,
          gridTemplateRows: `repeat(7, minmax(0,1fr))`,
          gap: 3,
          gridAutoFlow: 'column',
          width: '100%'
        }}
      >
        {all.map((i, idx) => (
          <ToolTip content={i?.tooltip}>
            <div
              key={idx}
              style={{
                background: i?.color
              }}
              className={classnames(i !== undefined && 'rounded aspect-square', i?.tooltip && 'cursor-pointer')}
            ></div>
          </ToolTip>
        ))}
      </div>
      <div className={'flex mt-4 justify-between'}>
        <div className={'flex gap-1 items-center transparent-font font-size-12'}>
          <div>
            <span className={'primary-font font-semibold'}>{review}</span> {t('review.studied')}
          </div>
          <span className={'text-xl leading-none'}>·</span>
          <div>
            <span className={'primary-font font-semibold'}>{due}</span> {t('review.to study')}
          </div>
        </div>
        <div className={'flex gap-6 items-center font-size-11'}>
          <div className={'flex gap-1 items-center transparent-font'}>
            <div className={'mr-1'}>{t('review.Studied')}</div>
            {colors.history.map(i => (
              <div
                key={i}
                className={'rounded size-3'}
                style={{
                  background: i
                }}
              ></div>
            ))}
          </div>
          <div className={'flex gap-1 items-center transparent-font'}>
            <div className={'mr-1'}>{t('review.To study')}</div>
            {colors.future.map(i => (
              <div
                key={i}
                className={'rounded size-3'}
                style={{
                  background: i
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})
