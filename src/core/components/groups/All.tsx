import { MetaStore } from '@/api/stores'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { memo, useLayoutEffect, useMemo, useState } from 'react'
import GroupStore from '@/api/stores/group.store'
import { Content, Icon } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import MetaGroup from '@/core/components/group/MetaGroup'
import { useTranslation } from 'react-i18next'

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
  useLayoutEffect(() => {
    if (allGroup) {
      setData(s => ({ ...s, ...allGroup, values: s.values }))
    }
  }, [allGroup])
  const metaMap = MetaStore.useMetaObjectsMap()
  useLayoutEffect(() => {
    const metas = Array.from(metaMap.values()).filter(i => !i.deleted)
    const sorted = Global.metaOps.sort('createdAt', 'desc', metas)
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
        title={useMemo(
          () => ({
            title: t('general.Library'),
            titleEditable: false,
            descriptionEditable: false
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
        state={useMemo(
          () => ({
            canHideGroupsInside: false,
            canDrag: true,
            canHideObjectsInside: false,
            canDragInside: true,
            defaultShowLabels: false,
            showTemp: false,
            addAfterCreateMeta: false
          }),
          []
        )}
        layout={useMemo(
          () => ({
            showDeletedMetas: false,
            showCreate: true,
            showContains: true,
            showAddNew: false,
            showDescription: false,
            showTitle: true,
            showAddObjectIntoSetting: false,
            showTitleActions: false,
            showIcon: false,
            showImport: false
          }),
          []
        )}
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
