import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { format } from 'date-fns'
import Calendar, { CalendarProps } from 'react-calendar'
import { Colors } from '@/consts'
import { Icon } from '@/components'
import { useState } from 'react'
import i18next from 'i18next'

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
  const [view, setView] = useState<CalendarProps['view']>('month')
  const locale = i18next.language
  return (
    <Calendar
      nextLabel={<Icon size={16} name={'park-right'} />}
      prevLabel={<Icon size={16} name={'park-left'} />}
      prev2Label={null}
      next2Label={null}
      onViewChange={e => {
        if (e.view === 'century') {
          return
        }
        setView(e.view)
        return
      }}
      view={view}
      className={css([
        {
          '.react-calendar__month-view__days__day': {
            ':hover': {
              background: Colors.Common.SelectColorTransparent,
              boxShadow: '0 0 0 2px var(--select-color)',
              borderRadius: 2
            }
          },
          '.react-calendar__navigation__arrow': css([
            ClassName.flatButton(),
            { fontWeight: 600, width: '24px !important', height: '24px !important' }
          ]),
          button: {
            outline: 'none',
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            ':disabled': {
              color: '#F48484',
              cursor: 'not-allowed'
            },
            width: 32,
            height: 32,
            padding: 4
          },
          fontSize: 14,
          abbr: {
            textDecoration: 'none !important',
            cursor: 'inherit !important'
          },
          '.react-calendar__month-view__weekdays': {
            fontSize: 14,
            color: Colors.Font.Transparent
          },
          '.react-calendar__navigation': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 500,
            padding: '4px 4px 0px'
          },
          '.react-calendar__viewContainer': {
            padding: 4
          },
          '.react-calendar__navigation__label': {
            fontWeight: 'inherit',
            flexGrow: '0 !important',
            margin: '0 auto',
            flexShrink: 0,
            width: 'auto !important'
          },
          '.react-calendar__month-view__weekdays__weekday': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          },
          '.react-calendar__navigation__label__labelText, .react-calendar__year-view__months__month, .react-calendar__decade-view__years__year':
            ClassName.flatButton(4, '5px 12px'),
          '.react-calendar__month-view__days__day--neighboringMonth': {
            color: Colors.Font.SuperTransparent
          },
          '.react-calendar__tile--active': {
            background: `${Colors.Common.SelectColor} !important`,
            color: 'white',
            borderRadius: 3
          }
        },
        className
      ])}
      value={value}
      locale={locale}
      formatDay={(locale, date) => format(date, 'd')}
      onChange={v => onChange?.(v)}
      maxDate={maxDate}
      minDate={minDate}
    />
  )
}

export default TimePicker
