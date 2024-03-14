import { ToolbarProps } from 'react-big-calendar'
import { memo } from 'react'
import { DateFormat } from '@/utils'
import { Content } from '@/components'

export default memo(({ onView, onNavigate, view, date }: ToolbarProps) => {
  const renderCurrentDate = () => {
    if (view === 'month') {
      return DateFormat.format(date, DateFormat.Formats.yearMonths)
    }
    if (view === 'day') {
      return DateFormat.format(date, DateFormat.Formats.yearMonthDays)
    }
  }
  return (
    <Content>
      <div
        className={'font-size-14 bold-font'}
        style={{
          margin: '0.6em'
        }}
      >
        {renderCurrentDate()}
      </div>
    </Content>
  )
})
