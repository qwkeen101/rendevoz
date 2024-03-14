import { DateCellWrapperProps } from 'react-big-calendar'
import { memo } from 'react'
import { isWeekend } from 'date-fns'
import { Colors } from '@/consts'

export default memo((props: DateCellWrapperProps) => {
  const weekend = isWeekend(props.value)
  return (
    <div
      className={'border-right'}
      style={{
        flex: '1 1 0%',
        background: weekend ? Colors.Background.Secondary : 'transparent'
      }}
    ></div>
  )
})
