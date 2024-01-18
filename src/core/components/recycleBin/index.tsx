import { MetaStore } from '@/api/stores'
import { memo, useEffect, useMemo, useState } from 'react'
import GroupStore from '../../../api/stores/group.store'
import Id from '@/utils/id'
import { Content, Icon } from '@/components'
import MetaGroup from '@/core/components/group/MetaGroup'
import { TabTitle } from '@/core/rendevoz/components'
import { calculateSortObjects } from '@/core/object/filter/BetterSorter'
import { useTranslation } from 'react-i18next'
import KeyvalueStore from '@/api/stores/keyvalue.store'

export default memo(() => {
  const recycleGroup = KeyvalueStore.useValue('recycleBinGroup')
  const deletedIds = MetaStore.useDeletedObjectsSet()
  const deleted = MetaStore.useMultipleObjects(Array.from(deletedIds.values()))
  const defaultValue = GroupStore.initializeGroup()
  const { t } = useTranslation()
  const [data, setData] = useState(
    recycleGroup ?? {
      ...defaultValue,
      hideObjectsInside: false,
      hideGroupsInside: false
    }
  )

  useEffect(() => {
    const sorted = calculateSortObjects(deleted, {
      sorters: [
        {
          field: 'deletedAt',
          type: 'descending',
          id: 1
        }
      ]
    })
    setData(s => ({ ...s, values: sorted.map(i => ({ rowId: i.id, type: 'metaObject', id: i.id })) }))
  }, [deleted])

  return (
    <Content fullHeight fullWidth>
      <TabTitle title={t('general.Trash')} icon={<Icon name={'park-recycling'} />} />
      <MetaGroup
        title={useMemo(
          () => ({
            title: t('general.Trash'),
            icon: 'arrows_counterclockwise',
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
                icon: 'park-delete'
              }
            ],
            canDrag: false,
            canHideObjectsInside: false
          }),
          []
        )}
        layout={useMemo(
          () => ({
            showAddObjectIntoSetting: false,
            showDeletedMetas: true,
            showDescription: false,
            showTitleActions: false,
            showAddNew: false,
            showImport: false,
            contextMenu: selected => [
              'deleteCompleted',
              'recover',
              ...(selected?.length === 1 ? ['separator', 'viewDetails', 'openInNewTab'] : [])
            ]
          }),
          []
        )}
        value={data}
        on={v => {
          if (v.type === 'groupDataChange') {
            console.log(v)
            if (v.value.values?.length !== undefined && v.value.values.length < data.values.length) {
              const currIds = new Set(v.value.values?.map(i => i.id))
              const deletedIds = new Set(data.values.filter(i => !currIds.has(i.id)).map(i => i.id))
              deletedIds.forEach(i => {
                MetaStore.deleteMetaObject(i, { force: true })
              })
            }
            setData(v.value)
            KeyvalueStore.updateOne('recycleBinGroup', v.value)
          }
        }}
      />
    </Content>
  )
})
