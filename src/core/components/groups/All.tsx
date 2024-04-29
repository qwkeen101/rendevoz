import { MetaStore, ObjectStore } from '@/api/stores'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { memo, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import GroupStore from '@/api/stores/group.store'
import { Content, Icon } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import MetaGroup from '@/core/components/group/MetaGroup'
import { useTranslation } from 'react-i18next'
import { calculateSortObjects } from '@/core/object/filter/BetterSorter'

export default memo(() => {
  const { t } = useTranslation()
  const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')!
  const allGroup = KeyvalueStore.useValue(`all_${currentWorkspace.id}_group`)
  const initialized = useMemo(() => GroupStore.initializeGroup(), [])
  const [data, setData] = useState(
    allGroup ?? {
      ...initialized,
      hideObjectsInside: false,
      hideGroupsInside: false,
      autoAddto: 'first',
      views: [
        {
          ...initialized.views[0],
          type: 'gallery',
          name: t('general.Gallery'),
          options: {
            ...initialized.views[0].options,
            thumbnailMode: true
          }
        }
      ]
    }
  )
  const metaMap = MetaStore.useMetaObjectsMap()
  useLayoutEffect(() => {
    const metas = Array.from(metaMap.values()).filter(i => !i.deleted)
    const sorted = calculateSortObjects(metas, {
      sorters: [
        {
          field: 'createdAt',
          type: 'descending',
          id: 1
        }
      ]
    })
    setData(s => ({
      ...s,
      values: sorted.map(i => ({
        rowId: i.id,
        id: i.id,
        type: 'metaObject'
      }))
    }))
  }, [metaMap])
  return (
    <Content fullWidth fullHeight>
      <TabTitle title={t('general.Library')} icon={<Icon name={'custom-card-library'} />} />
      <MetaGroup
        title={{
          title: t('general.Library'),
          titleEditable: false
        }}
        state={{
          canHideGroupsInside: false,
          canDrag: true,
          canHideObjectsInside: false,
          canDragInside: true
        }}
        layout={{
          showDeletedMetas: false,
          showDescription: false,
          showContains: true,
          showAddObjectIntoSetting: false,
          showTitleActions: false,
          showIcon: false,
          showImport: false
        }}
        value={data}
        on={v => {
          if (v.type === 'groupDataChange') {
            setData(v.value)
            KeyvalueStore.updateOne(`all_${currentWorkspace.id}_group`, v.value)
          }
        }}
      />
    </Content>
  )
})
