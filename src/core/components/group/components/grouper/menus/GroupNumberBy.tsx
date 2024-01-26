import { useDebounceFn, useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { Content } from '@/components'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { GROUPER_DEFAULT_GROUP_EVERY, GROUPER_DEFAULT_GROUP_RANGE } from '@/core/components/group/hooks/grouper/calculator/number'
import { useTranslation } from 'react-i18next'

export default () => {
  const currentGrouper = useSelectAtomValue(GroupStateAtom, s => s.currentView?.group)
  const instance = useGroupInstance()
  const { t } = useTranslation()
  const debounceUpdate = useDebounceFn(instance.updateCurrentView, { wait: 200 })
  if (currentGrouper?.fieldType === 'number') {
    const groupEvery = currentGrouper.groupEvery
    const groupRange = currentGrouper.groupRange
    return (
      <Content style={{ padding: '0 14px 14px', width: 290 }}>
        <div style={{ marginBottom: 4 }} className={'transparent-font font-size-12 normal-font'}>
          {t('general.Group range')}
        </div>
        <Content flex alignItems={'center'}>
          <input
            className={'border-box-shadow focus-input'}
            style={{ borderRadius: 3, width: '100%', padding: '3px 10px' }}
            defaultValue={groupRange?.from ?? GROUPER_DEFAULT_GROUP_RANGE.from}
            type={'number'}
            onChange={e => {
              debounceUpdate.run?.(w => ({
                ...w,
                group: { ...w.group, groupRange: { ...w.group?.groupRange, from: Number(e.target.value) } }
              }))
            }}
          />
          <span style={{ margin: '0 8px' }}>–</span>
          <input
            className={'border-box-shadow focus-input'}
            style={{ borderRadius: 3, width: '100%', padding: '3px 10px' }}
            defaultValue={groupRange?.to ?? GROUPER_DEFAULT_GROUP_RANGE.to}
            type={'number'}
            onChange={e => {
              debounceUpdate.run?.(w => ({
                ...w,
                group: { ...w.group, groupRange: { ...w.group?.groupRange, to: Number(e.target.value) } }
              }))
            }}
          />
        </Content>
        <div className={'transparent-font font-size-12 normal-font'} style={{ marginBottom: 4, marginTop: 16 }}>
          {t('general.Group every')}
        </div>
        <input
          className={'border-box-shadow focus-input'}
          style={{ borderRadius: 3, padding: '3px 10px', width: '100%' }}
          defaultValue={groupEvery ?? GROUPER_DEFAULT_GROUP_EVERY}
          type={'number'}
          onChange={e => {
            debounceUpdate.run?.(w => ({
              ...w,
              group: { ...w.group, groupEvery: Number(e.target.value) }
            }))
          }}
        />
      </Content>
    )
  }
  return null
}
