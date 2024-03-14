import { Content } from '@/components'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfDay, getDay, startOfWeek } from 'date-fns'
import enUS from 'date-fns/locale/en-US'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import Toolbar from './Toolbar'
const locales = {
  'en-US': enUS
}
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
})

import { memo, useMemo } from 'react'
import DayCellRenderer from '@/core/components/group/components/calendar/DayCellBg'
export default memo(() => {
  return (
    <Content>
      <Calendar
        formats={{
          weekdayFormat: date => format(date, 'E')
        }}
        events={[
          {
            start: new Date(),
            end: new Date(),
            title: 'asdad'
          },
          {
            start: new Date(),
            end: new Date(),
            title: 'asdad'
          },
          {
            start: new Date(),
            end: new Date(),
            title: 'asdad'
          },
          {
            start: new Date(),
            end: new Date(),
            title: 'asdad'
          },
          {
            start: new Date(),
            end: new Date(),
            title: 'asdad'
          },
          {
            start: new Date(),
            end: new Date(),
            title: 'asdad'
          }
        ]}
        components={{
          dateCellWrapper: DayCellRenderer,
          month: {
            dateHeader: () => null
          },
          toolbar: Toolbar
        }}
        localizer={localizer}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '800px', width: '100%' }}
      />
    </Content>
  )
})
