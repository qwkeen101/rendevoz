import { CSSProperties } from 'react'
import usePopoverCell from '@/core/components/group/hooks/usePopoverCell'
import { Button, Content, TimePicker } from '@/components'
import { DateFormat } from '@/utils'
import { PopupWrapper } from '@/core/components/group/components'

export default ({
  value,
  style,
  onChange,
  className
}: {
  style?: CSSProperties
  value?: number
  className?: string
  onChange?: (date: number | undefined) => void
}) => {
  const currDate = value
  const { openPopover, closePopover, renderPopover } = usePopoverCell()
  return (
    <>
      <Content
        className={className}
        role={'prop-container'}
        style={{
          width: '100%',
          ...style
        }}
        onClick={e => {
          const p = e.currentTarget.parentElement
          if (p) {
            openPopover(p)
          }
        }}
      >
        {currDate && DateFormat.format(currDate, DateFormat.Formats.yearMonthDays)}
      </Content>
      {renderPopover(box => (
        <PopupWrapper box={box}>
          <TimePicker
            value={currDate ? new Date(currDate) : undefined}
            onChange={date => {
              closePopover()
              onChange?.(date.getTime())
            }}
          />
          <div style={{ width: '100%', height: 1, background: 'var(--border-background)' }}></div>
          <div
            style={{
              width: '100%',
              padding: 4
            }}
          >
            <Button.IconButton
              onClick={() => {
                onChange?.(undefined)
                closePopover()
              }}
              icon={'park-close-one'}
              text={'Clear'}
            />
          </div>
        </PopupWrapper>
      ))}
    </>
  )
}
