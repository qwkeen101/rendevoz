import { PropertyFilterRule } from '~/typings'
import { useTranslation } from 'react-i18next'
import { AnimatePopover, Content, Selector, WithBorder } from '@/components'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'

export default function SingleOptionFilter({
  rule,
  onChange
}: {
  rule: PropertyFilterRule & { propType: 'singleSelect' }
  onChange: (newRule: PropertyFilterRule & { propType: 'singleSelect' }) => void
}) {
  const { t } = useTranslation()
  const opts = MetaStore.usePropOptions(rule.field)
  const options = ObjectStore('metaPropSelectOption').useMultiple(opts)
  const selectedOptions = ObjectStore('metaPropSelectOption').useValue(rule.value)

  const filterOptions = [
    {
      value: 'is',
      children: t('filter.is')
    },
    {
      value: 'is not',
      children: t('filter.is not')
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
          content={setV => (
            <WithBorder style={{ width: 300 }}>
              <Selector
                selectMode={true}
                items={options}
                selectedItems={selectedOptions ? [selectedOptions] : []}
                onSelect={v => {
                  onChange({ ...rule, value: v[0]?.id })
                  setV(false)
                }}
                mode={'single'}
              />
            </WithBorder>
          )}
        >
          <div style={BetterFilter.commonStyle}>
            {selectedOptions ? (
              <div
                className={ClassName.ellipsisFont(1)}
                style={{
                  maxWidth: 120,
                  borderRadius: 2,
                  padding: '0px 4px',
                  color: Colors.getAdaptFontColor(selectedOptions.color),
                  background: Colors.getAdaptColor(selectedOptions.color)
                }}
              >
                {selectedOptions.name}
              </div>
            ) : (
              <div style={{ color: Colors.Font.Transparent }}>{t('general.Select an option')}...</div>
            )}
          </div>
        </AnimatePopover>
      )}
    </Content>
  )
}
