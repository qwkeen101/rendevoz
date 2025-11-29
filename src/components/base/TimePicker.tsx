import { AnimatePopover, Icon, VirtualList, WithBorder } from '@/components'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { startOfMonth, endOfMonth, startOfWeek, addDays, format } from 'date-fns'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import { range } from 'lodash'

function getMonth42Days(year: number, month: number) {
  const firstDay = startOfMonth(new Date(year, month)) // 月初
  const startDay = startOfWeek(firstDay, { weekStartsOn: 1 }) // 找到月视图的第一天 (上个月填充部分)

  const days = []
  for (let i = 0; i < 42; i++) {
    const date = addDays(startDay, i)
    days.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      formatted: format(date, 'yyyy/MM/dd')
    })
  }

  return days
}

const TimePicker = ({
  className,
  onChange,
  value,
  maxDate,
  minDate
}: {
  className?: string
  onChange?: (date: Date) => void
  value?: Date
  maxDate?: Date
  minDate?: Date
}) => {
  const [year, setYear] = useState(2025)
  const [month, setMonth] = useState(2)

  const days = useMemo(() => {
    return getMonth42Days(year, month)
  }, [year, month])
  const { i18n } = useTranslation()
  const lang = i18n.language
  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(new Date(2025, 0, i + 6)).replace('周', '')
      ),
    []
  )
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(lang, { month: 'short' }).format(new Date(2025, i, 1))),
    []
  )
  const parent = useRef<HTMLDivElement>(null)
  const changeMonth = (dir: 'prev' | 'next') => {
    const current = new Date(year, month, 2)
    if (dir === 'prev') {
      current.setMonth(current.getMonth() - 1)
    } else {
      current.setMonth(current.getMonth() + 1)
    }
    setYear(current.getFullYear())
    setMonth(current.getMonth())
  }
  useLayoutEffect(() => {
    if (value) {
      setMonth(value.getMonth())
      setYear(value.getFullYear())
    }
  }, [value])

  return (
    <div className={'p-4'} ref={parent}>
      <div className={'flex items-center mb-4 select-none gap-2'}>
        <AnimatePopover
          padding={6}
          positions={['bottom', 'top']}
          parentElement={parent}
          content={setV => (
            <WithBorder className={'p-1 max-h-64 no-scrollbar font-size-13 overflow-y-auto min-w-20'}>
              {months.map((i, idx) => (
                <div
                  onClick={() => {
                    setV(false)
                    setMonth(idx)
                  }}
                  className={classnames('button', idx === month && 'active-button')}
                  key={i}
                >
                  {i}
                </div>
              ))}
            </WithBorder>
          )}
        >
          <div
            style={{
              height: 32
            }}
            className={
              'min-w-20 font-size-13 cursor-pointer light-hover transition-colors justify-between flex items-center gap-6 border rounded-lg py-1.5 px-2 w-fit'
            }
          >
            {new Intl.DateTimeFormat(lang, { month: 'short' }).format(new Date(2025, month, 1))}
            <Icon name={'park-down'} size={14} strokeWidth={5} className={'super-transparent-font'} />
          </div>
        </AnimatePopover>
        <AnimatePopover
          padding={6}
          positions={['bottom', 'top']}
          parentElement={parent}
          content={setV => (
            <WithBorder className={'p-1 font-size-13 min-w-24'}>
              <VirtualList
                estimateSize={20}
                items={range(0, 3000)}
                initialFocusIndex={year}
                renderItem={i => (
                  <div
                    onClick={() => {
                      setYear(i)
                      setV(false)
                    }}
                    className={classnames('button', i === year && 'active-button')}
                  >
                    {i}
                  </div>
                )}
                className={'no-scrollbar max-h-64'}
              ></VirtualList>
            </WithBorder>
          )}
        >
          <div
            style={{
              height: 32
            }}
            className={
              'min-w-24 font-size-13 cursor-pointer light-hover transition-colors justify-between flex items-center gap-6 border rounded-lg py-1.5 px-2 w-fit'
            }
          >
            {year}
            <Icon name={'park-down'} size={14} strokeWidth={5} className={'super-transparent-font'} />
          </div>
        </AnimatePopover>
        <Icon size={15} onClick={() => changeMonth('prev')} strokeWidth={4} name={'park-left'} className={'square-button ml-auto'} />
        <Icon size={15} onClick={() => changeMonth('next')} strokeWidth={4} name={'park-right'} className={'square-button'} />
      </div>
      <div className={'grid grid-cols-7 mb-2'}>
        {weekdays.map(i => (
          <div className={'text-center small-transparent'} key={i}>
            {i}
          </div>
        ))}
      </div>
      <div
        style={{
          gap: 4
        }}
        className={'grid grid-cols-7'}
      >
        {days.map(i => (
          <div
            key={i.formatted}
            style={{
              width: 32,
              height: 32
            }}
            onClick={() => {
              onChange?.(new Date(i.year, i.month, i.day))
            }}
            className={classnames(
              i.day === value?.getDate() && i.month === value.getMonth() && i.year === value.getFullYear() && 'active-button',
              i.month !== month && 'super-transparent-font',
              'rounded-full flex items-center justify-center leading-none cursor-pointer light-hover transition-colors'
            )}
          >
            {i.day}
          </div>
        ))}
      </div>
    </div>
  )
}

export default TimePicker
