import { MetaStore } from '@/api/stores'
import { memo, useLayoutEffect, useMemo, useState } from 'react'
import GroupStore from '../../../api/stores/group.store'
import { Content, Icon, TabTitle } from '@/components'
import MetaGroup from '@/core/components/group/MetaGroup'
import { useTranslation } from 'react-i18next'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { IGroupInstance } from '~/typings'

export default memo(({ onInstanceInitialized }: { onInstanceInitialized?: (i: IGroupInstance) => void }) => {
  const recycleGroup = KeyvalueStore.useValue('recycleBinGroup')
  const all = MetaStore.useAll({ showDeleted: true, showAll: true })
  const { t } = useTranslation()
  const [data, setData] = useState(
    recycleGroup ?? {
      ...GroupStore.initializeGroup(),
      hideObjectsInside: false,
      hideGroupsInside: false
    }
  )

  useLayoutEffect(() => {
    const sorted = Global.metaOps.sort(
      'deletedAt',
      'desc',
      all.filter(i => i.deleted)
    )
    setData(s => ({ ...s, values: sorted.map(i => ({ rowId: i.id, type: 'metaObject', id: i.id })) }))
  }, [all])

  return (
    <Content fullHeight fullWidth>
      <TabTitle title={t('general.Trash')} icon={<Icon name={'park-delete-one'} />} />
      <MetaGroup
        title={useMemo(
          () => ({
            title: t('general.Trash'),
            icon: 'park-delete-one',
            titleEditable: false
          }),
          []
        )}
        state={useMemo(
          () => ({
            canHideGroupsInside: false,
            extraProperties: [
              {
                type: 'basic',
                display: 'general.deletedAt',
                name: 'deletedAt',
                visible: true,
                id: 111,
                editable: false,
                icon: 'park-delete-one'
              }
            ],
            canDrag: false,
            canHideObjectsInside: false
          }),
          []
        )}
        onInstanceInitialized={onInstanceInitialized}
        layout={useMemo(
          () => ({
            showAddObjectIntoSetting: false,
            showDeletedMetas: true,
            showDescription: false,
            showTitleActions: false,
            showIcon: true,
            showClearAll: true,
            showAddNew: false,
            showImport: false,
            contextMenu: () => ['deleteCompleted', 'recover', 'separator']
          }),
          []
        )}
        styles={useMemo(
          () => ({
            titleContainerStyle: {
              paddingTop: 42
            }
          }),
          []
        )}
        value={{ ...data, ...recycleGroup, values: data.values }}
        on={v => {
          if (v.type === 'clearAll') {
            data.values.forEach(i => {
              MetaStore.deleteMetaObject(i.id, { force: true })
            })
          }
          if (v.type === 'deleteRow') {
            const id = v.metaId
            MetaStore.deleteMetaObject(id, { force: true, silent: true })
          }
          if (v.type === 'groupDataChange') {
            setData(v.value)
            KeyvalueStore.updateOne('recycleBinGroup', v.value)
          }
        }}
      />
    </Content>
  )
})
