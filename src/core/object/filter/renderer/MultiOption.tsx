import { PropertyFilterRule } from '~/typings'
import { useTranslation } from 'react-i18next'
import { AnimatePopover, Content, Selector, WithBorder } from '@/components'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'

export default function MultiOptionFilter({
  rule,
  onChange
}: {
  rule: PropertyFilterRule & { propType: 'multiSelect' }
  onChange: (newRule: PropertyFilterRule & { propType: 'multiSelect' }) => void
}) {
  const { t } = useTranslation()
  const opts = MetaStore.usePropOptions(rule.field)
  const options = ObjectStore('metaPropSelectOption').useMultiple(opts)

  const selectedOptions = ObjectStore('metaPropSelectOption').useMultiple(rule.value)

  const filterOptions = [
    {
      value: 'contains',
      children: t('filter.contains')
    },
    {
      value: 'not contains',
      children: t('filter.not contains')
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
    <Content flex gap={BetterFilter.horizontalGap}>
      <BetterFilter.FilterSelect options={filterOptions} value={rule.type} onSelect={v => onChange({ ...rule, type: v })} />
      {!['empty', 'not empty'].includes(rule.type) && (
        <AnimatePopover
          positions={['bottom']}
          padding={8}
          withClickCover={true}
          content={
            <WithBorder style={{ width: 300 }}>
              <Selector
                selectMode={true}
                items={options}
                selectedItems={selectedOptions}
                onSelect={v => {
                  onChange({ ...rule, value: v.map(i => i.id) })
                }}
                mode={'multi'}
              />
            </WithBorder>
          }
        >
          <Content flex gap={4} style={{ ...BetterFilter.commonStyle, flexWrap: 'wrap' }}>
            {selectedOptions.length ? (
              selectedOptions.map(i => (
                <div
                  key={i.id}
                  className={ClassName.ellipsisFont(1)}
                  style={{
                    maxWidth: '60px',
                    borderRadius: 2,
                    padding: '0px 4px',
                    color: Colors.getAdaptFontColor(i.color),
                    background: Colors.getAdaptColor(i.color)
                  }}
                >
                  {i.name}
                </div>
              ))
            ) : (
              <div style={{ color: Colors.Font.Transparent }}>Select options...</div>
            )}
          </Content>
        </AnimatePopover>
      )}
    </Content>
  )
}
