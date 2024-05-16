import { PropertyFilterRule } from '~/typings'
import { useTranslation } from 'react-i18next'
import { AnimatePopover, Content, TimePicker, WithBorder } from '@/components'
import { DateFormat } from '@/utils'
import BetterFilter from '@/core/object/filter/BetterFilter'

export default function DateFilter({
  rule,
  onChange
}: {
  rule: PropertyFilterRule & { propType: 'date' }
  onChange: (newRule: PropertyFilterRule & { propType: 'date' }) => void
}) {
  const { t } = useTranslation()
  const typeOptions = [
    {
      value: 'is',
      children: t('filter.is')
    },
    {
      value: 'on and before',
      children: t('filter.is on or before')
    },
    {
      value: 'before',
      children: t('filter.is before')
    },
    {
      value: 'on and after',
      children: t('filter.is on or after')
    },
    {
      value: 'after',
      children: t('filter.is after')
    },
    {
      value: 'empty',
      children: t('filter.is empty')
    },
    {
      value: 'not empty',
      children: t('filter.is not empty')
    }
  ]
  const dateOptions = [
    {
      value: 'today',
      children: t('filter.today')
    },
    {
      value: 'yesterday',
      children: t('filter.yesterday')
    },
    {
      value: 'one week ago',
      children: t('filter.one week ago')
    },
    {
      value: 'one month ago',
      children: t('filter.one month ago')
    },
    {
      value: 'three month ago',
      children: t('filter.three months ago')
    },
    {
      value: 'specific',
      children: t('filter.specific date')
    }
  ]
  return (
    <Content flex gap={BetterFilter.horizontalGap}>
      <BetterFilter.FilterSelect options={typeOptions} value={rule.type} onSelect={v => onChange({ ...rule, type: v })} />
      {rule.type !== 'empty' && rule.type !== 'not empty' && (
        <BetterFilter.FilterSelect
          options={dateOptions}
          value={rule.value}
          onSelect={v => {
            onChange({ ...rule, value: v })
          }}
        />
      )}
      {rule.value === 'specific' && (
        <AnimatePopover
          withClickCover={true}
          positions={['bottom']}
          content={setVisible => (
            <WithBorder padding={6} style={{ width: 240, fontSize: 13 }}>
              <TimePicker
                onChange={v => {
                  setVisible(false)
                  onChange({ ...rule, specDate: v.getTime() })
                }}
              />
            </WithBorder>
          )}
        >
          <div style={BetterFilter.commonStyle}>
            {rule.specDate ? DateFormat.format(rule.specDate, DateFormat.Formats.default) : 'Select date'}
          </div>
        </AnimatePopover>
      )}
    </Content>
  )
}
