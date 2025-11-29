import { memo, useEffect, useMemo, useState } from 'react'
import { MetaObject } from '~/typings'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { MetaStore } from '@/api/stores'
import GroupStore from '../../../api/stores/group.store'
import { Content, Icon, TabTitle } from '@/components'
import MetaGroup from '@/core/components/group/MetaGroup'

function TypeGroup({ type }: { type: MetaObject['type'] }) {
  const workspace = KeyvalueStore.useValue('currentWorkspace')
  const typeGroup = KeyvalueStore.useValue(`${type}_${workspace?.id}_group`)
  const allMetas = MetaStore.useIndexedMetaObjects()?.typeToMetaObjectIdsMap.get(type)
  const [data, setData] = useState(
    typeGroup ?? {
      ...GroupStore.initializeGroup(),
      hideObjectsInside: false,
      hideGroupsInside: false,
      autoAddto: 'first'
    }
  )
  useEffect(() => {
    if (allMetas?.size) {
      const map = MetaStore.getMetaObjectsMap()
      const allTypeMetas = Array.from(allMetas?.values() || [])
        .map(o => map.get(o))
        .filter(i => i && !i.deleted) as MetaObject[]
      const sorted = Global.metaOps.sort('createdAt', 'desc', allTypeMetas)
      setData(s => ({ ...s, values: sorted.map(i => ({ rowId: i.id, type: 'metaObject', id: i.id })) }))
    }
  }, [allMetas?.size])
  return (
    <Content fullHeight fullWidth>
      <TabTitle title={Global.utils.getTypeName(type)} icon={<Icon name={Global.utils.getIcon(type)} />} />
      <MetaGroup
        title={useMemo(
          () => ({
            title: Global.utils.getTypeName(type),
            icon: Global.utils.getIcon(type),
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
            canTurnHiddenIntoUnhidden: false,
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
            showCreate: !!Global.metaOps?.canCreateDirectly(type),
            showDeletedMetas: false,
            showDescription: false,
            showAddNew: false,
            showTitleActions: false,
            showIcon: false,
            hideContextMenuItems: ['deleteCompleted', 'deleteInGroup', 'addRowAbove', 'addRowBelow']
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
        value={{ ...data, ...typeGroup, values: data.values }}
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
