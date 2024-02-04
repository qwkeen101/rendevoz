import { memo, useEffect, useMemo, useState } from 'react'
import { MetaObject } from '~/typings'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { MetaStore } from '@/api/stores'
import GroupStore from '../../../../api/stores/group.store'
import { Content, Icon } from '@/components'
import { TabTitle } from '@/core/rendevoz/components'
import MetaGroup from '@/core/components/group/MetaGroup'
import { calculateSortObjects } from '@/core/object/filter/BetterSorter'
import { GlobalInstance } from '@/hooks'
import { Rendevoz } from '@/core/rendevoz'

function TypeGroup({ type }: { type: MetaObject['type'] }) {
  const workspace = KeyvalueStore.useValue('currentWorkspace')
  const typeGroup = KeyvalueStore.useValue(`${type}_${workspace?.id}_group`)
  const defaultValue = GroupStore.initializeGroup()
  const allMetas = MetaStore.useIndexedMetaObjects()?.typeToMetaObjectIdsMap.get(type)
  const [data, setData] = useState(
    typeGroup ?? {
      ...defaultValue,
      hideObjectsInside: false,
      hideGroupsInside: false,
      autoAddto: 'last'
    }
  )
  useEffect(() => {
    if (allMetas?.size) {
      const map = MetaStore.getMetaObjectsMap()
      const allTypeMetas = Array.from(allMetas?.values() || [])
        .map(o => map.get(o))
        .filter(i => i && !i.deleted && !i.temp) as MetaObject[]
      const sorted = calculateSortObjects(allTypeMetas, {
        sorters: [
          {
            field: 'createdAt',
            type: 'ascending',
            id: 1
          }
        ]
      })
      setData(s => ({ ...s, values: sorted.map(i => ({ rowId: i.id, type: 'metaObject', id: i.id })) }))
    }
  }, [allMetas?.size])
  return (
    <Content fullHeight fullWidth>
      <TabTitle title={Rendevoz.Utils.Meta.getTypeName(type)} icon={<Icon name={Rendevoz.Utils.Object.getMetaObjectIcon(type)} />} />
      <MetaGroup
        title={useMemo(
          () => ({
            title: Rendevoz.Utils.Meta.getTypeName(type),
            icon: Rendevoz.Utils.Object.getMetaObjectIcon(type),
            titleEditable: false
          }),
          []
        )}
        state={useMemo(
          () => ({
            canHideGroupsInside: type === 'group',
            invisibleProperties: [1],
            canDrag: true,
            canHideObjectsInside: true,
            onlyCreateType: type,
            deleteMetaWhenDeleteItem: true,
            canDragInside: false,
            addAfterCreateMeta: false
          }),
          []
        )}
        layout={useMemo(
          () => ({
            showImport: false,
            showAddNew: !!GlobalInstance.metaOps?.canCreateDirectly(type),
            showDeletedMetas: false,
            showDescription: false,
            showTitleActions: false,
            hideContextMenuItems: ['deleteCompleted', 'deleteObject', 'addRowAbove', 'addRowBelow']
          }),
          []
        )}
        value={{ ...data }}
        on={v => {
          if (v.type === 'groupDataChange') {
            setData(v.value)
            KeyvalueStore.updateOne(`${type}_${workspace?.id}_group`, v.value)
          }
          if (v.type === 'deleteRow') {
            MetaStore.deleteMetaObject(v.metaId)
          }
        }}
      />
    </Content>
  )
}

export default memo(TypeGroup)
