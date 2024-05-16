import { useTranslation } from 'react-i18next'
import { CheckBox, Content } from '@/components'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { PropertyFilterRule } from '~/typings'

export default function CheckboxFilter({
  rule,
  onChange
}: {
  rule: PropertyFilterRule & { propType: 'checkbox' }
  onChange: (newRule: PropertyFilterRule & { propType: 'checkbox' }) => void
}) {
  const { t } = useTranslation()
  const filterOptions = [
    {
      value: 'is',
      children: t('filter.is')
    },
    {
      value: 'is not',
      children: t('filter.is not')
    }
  ]
  return (
    <Content flex gap={BetterFilter.horizontalGap}>
      <BetterFilter.FilterSelect options={filterOptions} value={rule.type || 'is'} onSelect={v => onChange({ ...rule, type: v })} />
      <div onClick={() => onChange?.({ ...rule, value: !rule.value })} style={{ ...BetterFilter.commonStyle, width: 80 }}>
        <CheckBox
          style={{
            width: 16,
            height: 16
          }}
          checked={rule.value}
        />
      </div>
    </Content>
  )
}
