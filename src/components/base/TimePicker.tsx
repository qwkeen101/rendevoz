import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { format } from 'date-fns'
import Calendar from 'react-calendar'
import { Colors } from '@/consts'

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
  return (
    <Calendar
      className={css([
        {
          button: [
            {
              outline: 'none',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              ':disabled': {
                color: '#F48484',
                cursor: 'not-allowed'
              }
            },
            ClassName.flatButton(3, '2px 8px')
          ],
          fontSize: 14,
          abbr: {
            textDecoration: 'none !important',
            cursor: 'inherit !important'
          },
          '.react-calendar__month-view__weekdays': {
            fontSize: 14
          },
          '.react-calendar__navigation': {
            display: 'flex',
            justifyContent: 'center',
            fontWeight: 600,
            padding: '4px 4px 0px'
          },
          '.react-calendar__viewContainer': {
            padding: 4
          },
          '.react-calendar__navigation__label': {
            fontWeight: 'inherit'
          },
          '.react-calendar__navigation__arrow': {
            fontWeight: 'inherit'
          },
          '.react-calendar__month-view__weekdays__weekday': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          },
          '.react-calendar__month-view__days__day--neighboringMonth': {
            color: Colors.Background.ButtonActive
          },
          '.react-calendar__tile--active': {
            background: Colors.Background.ButtonActive
          }
        },
        className
      ])}
      value={value}
      formatDay={(locale, date) => format(date, 'd')}
      onChange={v => onChange?.(v)}
      maxDate={maxDate}
      minDate={minDate}
    />
  )
}

export default TimePicker
