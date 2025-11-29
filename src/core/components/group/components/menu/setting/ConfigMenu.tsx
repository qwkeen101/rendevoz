import { memo, useRef } from 'react'
import useGroupState from '@/core/components/group/hooks/useGroupState'
import { useTranslation } from 'react-i18next'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { Content } from '@/components'
import ButtonSelect from '@/components/base/ButtonSelect'
import ButtonSwitch from '@/components/base/ButtonSwitch'
import { ObjectCreateHandler } from '@/core/global/components/ObjectCreator'
import { MetaObject } from '~/typings'
export default memo(() => {
  const [groupState, setGroupState] = useGroupState()
  const { t } = useTranslation()
  const instance = useGroupInstance()
  const groupStateState = groupState.state
  const groupLayout = groupState.layout
  const openInOptions = [
    {
      value: 'newTab',
      children: t('general.New tab')
    },
    {
      value: 'sidePeek',
      children: t('general.Side peek')
    },
    {
      value: 'center',
      children: t('general.Center')
    }
  ]
  const createObjectTypes = ['none', ...Object.keys(ObjectCreateHandler)]
  return (
    <Content style={{ padding: '0 0.25rem 0.4rem' }}>
      {!groupStateState?.onlyCreateType && groupLayout?.showAddNew !== false && (
        <ButtonSelect
          name={t('general.Default new object type')}
          closeOnSelect={true}
          value={groupState.data?.onlyCreate || 'none'}
          options={createObjectTypes.map(i => ({ value: i, children: t(`general.${i}`) }))}
          onSelect={v => {
            instance.updateGroupData?.(s => ({ ...s, onlyCreate: v[0] === 'none' ? undefined : (v[0] as MetaObject['type']) }))
          }}
        />
      )}
      {!groupStateState?.onlyOpenIn && (
        <ButtonSelect
          name={t('general.Open object in')}
          closeOnSelect={true}
          value={groupState.data?.openIn || 'newTab'}
          options={openInOptions}
          onSelect={v => {
            instance.updateGroupData?.(s => ({ ...s, openIn: v[0] }))
          }}
        />
      )}
      {groupLayout?.showAddObjectIntoSetting !== false && (
        <ButtonSelect
          closeOnSelect={true}
          name={t('general.Add from outside to')}
          onSelect={v => {
            instance.updateGroupData?.(s => ({ ...s, autoAddto: v[0] }))
          }}
          value={groupState.data?.autoAddto || 'first'}
          options={[
            {
              value: 'first',
              children: t('general.First')
            },
            {
              value: 'last',
              children: t('general.Last')
            }
          ]}
        />
      )}
      {groupStateState?.canHideObjectsInside !== false && (
        <ButtonSwitch
          onChange={v => {
            instance.updateGroupData?.(s => ({
              ...s,
              hideObjectsInside: v
            }))
          }}
          name={t('general.Hide objects')}
          value={!!groupState.data?.hideObjectsInside}
        ></ButtonSwitch>
      )}
    </Content>
  )
})
