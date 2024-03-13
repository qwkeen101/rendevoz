import { MetaStore, ObjectStore } from '@/api/stores'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { useEffect, useRef, useState } from 'react'
import GroupStore from '../../../api/stores/group.store'
import { Content, Icon } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import MetaGroup from '@/core/components/group/MetaGroup'
import { MetaObject } from '~/typings'
import { calculateSortObjects } from '@/core/object/filter/BetterSorter'

export default ({ propId }: { propId: number }) => {
  const prop = ObjectStore('metaProp').useValue(propId)
  const propGroup = KeyvalueStore.useValue(`prop_${propId}_group`)
  const defaultValue = GroupStore.initializeGroup()
  const propIdToMetaIds = MetaStore.useIndexedMetaObjects()?.propToMetaObjectIdsMap
  const [data, setData] = useState(
    propGroup ?? {
      ...defaultValue,
      hideObjectsInside: false,
      hideGroupsInside: false,
      autoAddto: 'last'
    }
  )
  useEffect(() => {
    const set = propIdToMetaIds?.get(propId)
    if (set) {
      const metaMap = MetaStore.getMetaObjectsMap()
      const metas = Array.from(
        new Set(
          Array.from(set.values())
            .map(i => metaMap.get(i))
            .filter(i => i) as MetaObject[]
        ).values()
      )
      const sorted = calculateSortObjects(metas, {
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
  }, [propIdToMetaIds?.get(propId)])
  const metaRef = useRef<number[]>([])
  if (!prop) return null
  return (
    <Content fullHeight fullWidth>
      <TabTitle title={prop.name || 'Unnamed property'} icon={prop.icon && <Icon name={prop.icon} />} />
      <MetaGroup
        title={{
          title: prop.name || 'Unnamed property',
          icon: prop.icon || 'park-all-application',
          titleEditable: true
        }}
        state={{
          mustExistProperties: [propId],
          canHideGroupsInside: true,
          canDrag: true,
          canHideObjectsInside: true,
          canDragInside: true
        }}
        layout={{
          showDeletedMetas: false,
          showDescription: false,
          showTitleActions: false
        }}
        value={data}
        on={v => {
          if (v.type === 'groupDataChange') {
            setData(v.value)
            if (v.value.values !== data.values) {
              const itemIds = new Set(propIdToMetaIds?.get(propId))
              const filtered = v.value.values?.filter(i => !itemIds.has(i.id)) || []
              if (filtered.length) {
                MetaStore.updateProperty(
                  filtered.map(i => i.id),
                  propId,
                  {
                    value: undefined
                  },
                  true
                )
              }
            }
            KeyvalueStore.updateOne(`prop_${propId}_group`, v.value)
          }
          if (v.type === 'groupMetaChange') {
            ObjectStore('metaProp').updateOne({ id: propId, name: v.value.name ?? prop.name, icon: v.value.icon ?? prop?.icon })
          }
          if (v.type === 'deleteRow') {
            if (metaRef.current.length === 0) {
              metaRef.current.push(v.metaId)
              setTimeout(() => {
                const ids = new Set(metaRef.current)
                metaRef.current = []
                ids.forEach(id => {
                  MetaStore.updateProperty(id, propId, null)
                })
              })
            } else {
              metaRef.current.push(v.metaId)
            }
          }
        }}
      />
    </Content>
  )
}
