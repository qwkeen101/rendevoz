import { useTranslation } from 'react-i18next'
import { Content } from '@/components'
import { FilterSelect } from '@/core/object/filter/BetterFilter'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import { PropertyFilterRule } from '~/typings'

export default function NumberFilter({
  rule,
  onChange
}: {
  rule: PropertyFilterRule & { propType: 'number' }
  onChange: (newRule: PropertyFilterRule & { propType: 'number' }) => void
}) {
  const { t } = useTranslation()
  const filterOptions = [
    {
      value: 'is',
      children: '='
    },
    {
      value: 'is not',
      children: '≠'
    },
    {
      value: 'gt',
      children: '>'
    },
    {
      value: 'gte',
      children: '≥'
    },
    {
      value: 'lt',
      children: '<'
    },
    {
      value: 'lte',
      children: '≤'
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
  return (
    <Content flex gap={8}>
      <FilterSelect options={filterOptions} value={rule.type || 'is'} onSelect={v => onChange({ ...rule, type: v })} />
      <input
        value={rule.value}
        className={ClassName.noStyleInput}
        onChange={e => {
          onChange?.({ ...rule, value: Number(e.target.value) })
        }}
        placeholder={t('filter.value')}
        style={{
          border: `1px solid ${Colors.Background.Border}`,
          borderRadius: 6,
          padding: '3px 8px',
          lineHeight: 1.2,
          width: 120
        }}
      />
    </Content>
  )
}
