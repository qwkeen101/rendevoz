import { ToolbarProps } from 'react-big-calendar'
import { memo } from 'react'
import { DateFormat } from '@/utils'
import { Content, Icon } from '@/components'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'

export default memo(({ onView, onNavigate, view, date }: ToolbarProps) => {
  const renderCurrentDate = () => {
    if (view === 'month') {
      return DateFormat.format(date, DateFormat.Formats.yearMonths)
    }
    if (view === 'day') {
      return DateFormat.format(date, DateFormat.Formats.yearMonthDays)
    }
  }
  const { t } = useTranslation()
  return (
    <>
      <Content
        style={{
          position: 'sticky',
          top: 0,
          background: Colors.Background.Global,
          zIndex: 10,
          left: 'var(--page-padding-left)',
          marginLeft: 'calc(-var(--page-padding-left))',
          width: 'calc(var(--group-width) - var(--page-padding-right) - var(--page-padding-left))'
        }}
        flex
        alignItems={'center'}
        justifyContent={'space-between'}
      >
        <div
          style={{
            zIndex: -1,
            background: Colors.Background.Global,
            position: 'absolute',
            top: 0,
            bottom: 0,
            pointerEvents: 'none',
            right: 'calc(-1 * var(--page-padding-right))',
            left: 'calc(-1 * var(--page-padding-left))'
          }}
        ></div>
        <div
          className={'font-size-14 bold-font'}
          style={{
            margin: '0.6em'
          }}
        >
          {renderCurrentDate()}
        </div>
        <Content flex gap={4} alignItems={'center'} className={'font-size-14 transparent-font'}>
          <Icon onClick={() => onNavigate('PREV')} className={ClassName.flatButton(4, '4px')} size={16} name={'park-left'} />
          <div onClick={() => onNavigate('TODAY')} className={ClassName.flatButton(4, '2px 4px')}>
            {t('general.today')}
          </div>
          <Icon onClick={() => onNavigate('NEXT')} className={ClassName.flatButton(4, '4px')} size={16} name={'park-right'} />
        </Content>
      </Content>
    </>
  )
})
