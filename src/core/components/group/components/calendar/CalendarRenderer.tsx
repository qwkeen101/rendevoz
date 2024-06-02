import { Content } from '@/components'
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar'
import { format, parse, startOfDay, getDay, startOfWeek } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'

import 'react-big-calendar/lib/css/react-big-calendar.css'
import Toolbar from './Toolbar'
const locales = {
  'en-US': enUS,
  'zh-CN': zhCN
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
import { MetaGroupChild } from '~/typings'
import { MetaStore } from '@/api/stores'
import EventRenderer from '@/core/components/group/components/calendar/EventRenderer'
import { css } from '@emotion/css'
import { Colors } from '@/consts'
import { DateFormat } from '@/utils'
import { useSelectAtomValue, useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
export default memo(({ value }: { value?: MetaGroupChild[] }) => {
  const bottomPadding = useSelectAtomValue(GroupStateAtom, s => s.styles?.bottomPadding) ?? 60
  const currLang = useSelectGlobalAtomValue(SettingAtom, s => s.general.language || s.general.defaultLanguage)
  const events = useMemo(
    () =>
      value
        ?.map(i => {
          const m = MetaStore.getCachedMetaObject(i.id)
          if (m) {
            return {
              start: new Date(m.createdAt),
              end: new Date(m.createdAt),
              title: m.name || m.placeholderName,
              resource: i
            } as Event
          }
        })
        .filter(i => i) as Event[],
    [value]
  )

  const currentView = useSelectAtomValue(GroupStateAtom, s => s.currentView)
  const calendarSize = currentView?.options.calendarSize ?? 'standard'

  return (
    <Content
      style={{
        width: calendarSize === 'standard' ? '100%' : calendarSize === 'large' ? 'max(100%, 1800px)' : 'max(100%, 2800px)',
        padding: `0px var(--page-padding-right) ${bottomPadding}px var(--page-padding-right)`
      }}
    >
      <div
        style={{
          width: '100%'
        }}
      >
        <Calendar
          formats={{
            weekdayFormat: date => DateFormat.format(date, 'E')
          }}
          allDayMaxRows={5}
          events={events}
          showAllEvents
          culture={currLang}
          views={['month']}
          components={{
            dateCellWrapper: DayCellRenderer,
            event: EventRenderer,
            toolbar: Toolbar,
            month: {}
          }}
          className={css({
            '.rbc-row-segment': {
              padding: '3px 6px'
            },
            '.rbc-month-row': {
              overflow: 'visible',
              paddingBottom: 4,
              borderLeft: '1px solid var(--border-background)'
            },
            '.rbc-row-content-scrollable': {
              minHeight: 120
            },
            '.rbc-month-header': {
              position: 'sticky',
              top: 38,
              zIndex: 10,
              background: Colors.Background.Global
            },
            '.rbc-header': {
              height: 24,
              color: Colors.Font.Transparent,
              fontSize: 12,
              borderBottom: '1px solid var(--border-background)',
              fontWeight: 400
            },
            '.rbc-selected': {
              backgroundColor: 'transparent !important'
            },
            '.rbc-month-row + .rbc-month-row': {
              borderTop: '1px solid var(--border-background)'
            },
            '.rbc-month-view': {
              border: 'none',
              borderBottom: '1px solid var(--border-background)'
            },
            '.rbc-event-label': {
              display: 'none'
            },
            '.rbc-header + .rbc-header': {
              borderLeft: 'none'
            },
            '.rbc-date-cell': {
              fontSize: 13,
              '&.rbc-off-range': {
                color: Colors.Font.SuperTransparent
              }
            },
            '.rbc-event': css([
              {
                background: 'transparent',
                padding: 0
              },
              'font-size-14'
            ]),
            '.rbc-event-content': {
              overflow: 'visible',
              borderRadius: 6
            }
          })}
          localizer={localizer}
          startAccessor="start"
          endAccessor="end"
          style={{ minHeight: '800px', width: '100%' }}
        />
      </div>
    </Content>
  )
})
