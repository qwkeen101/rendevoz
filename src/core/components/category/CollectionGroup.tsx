import { CollectionStore, MetaStore } from '@/api/stores'
import { useSelectGlobalAtomValue } from '@/hooks'
import { collectionsAtom } from '@/api/stores/collection.store'
import MetaGroup from '@/core/components/group/MetaGroup'
import { Content, Icon } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import { useEffect, useMemo, useRef, useState } from 'react'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import GroupStore from '../../../api/stores/group.store'
import { MetaObject } from '~/typings'
import { calculateSortObjects } from '@/core/object/filter/BetterSorter'

export default ({ id }: { id: number }) => {
  const collection = useSelectGlobalAtomValue(collectionsAtom, s => s.get(id))
  const collectionGroup = KeyvalueStore.useValue(`collection_${id}_group`)
  const defaultValue = GroupStore.initializeGroup()
  const [data, setData] = useState(
    collectionGroup ?? {
      ...defaultValue,
      hideObjectsInside: false,
      hideGroupsInside: false,
      autoAddto: 'last'
    }
  )
  useEffect(() => {
    if (collection?.items) {
      const metaMap = MetaStore.getMetaObjectsMap()
      const metas = Array.from(
        new Set(
          collection.items
            .filter(i => i.type === 'meta' && i.id)
            .map(i => metaMap.get(i.id!))
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
  }, [collection?.items])
  const metaRef = useRef<number[]>([])
  if (!collection || collection.deleted) return null
  return (
    <Content fullHeight fullWidth>
      <TabTitle title={collection?.name || 'Unnamed collection'} icon={<Icon name={'park-folder-close'} />} />
      <MetaGroup
        title={useMemo(
          () => ({
            title: collection?.name || 'Unnamed collection',
            icon: collection.icon || 'park-folder-close',
            titleEditable: true
          }),
          [collection]
        )}
        state={useMemo(
          () => ({
            canHideGroupsInside: true,
            canDrag: true,
            canHideObjectsInside: true,
            canDragInside: true
          }),
          []
        )}
        layout={useMemo(
          () => ({
            showDeletedMetas: false,
            showDescription: false,
            showTitleActions: false
          }),
          []
        )}
        value={data}
        on={v => {
          if (v.type === 'groupDataChange') {
            setData(v.value)
            if (v.value.values !== data.values) {
              const itemIds = new Set(collection.items?.map(i => i.id))
              const filtered = v.value.values?.filter(i => !itemIds.has(i.id)) || []
              if (filtered.length) {
                CollectionStore.updateCollection({
                  id: collection.id,
                  items: [...(collection.items || []), ...filtered.map(i => ({ id: i.id, type: 'meta' }))]
                })
              }
            }
            KeyvalueStore.updateOne(`collection_${id}_group`, v.value)
          }
          if (v.type === 'groupMetaChange') {
            CollectionStore.updateCollection({ id, name: v.value.name ?? collection.name, icon: v.value.icon ?? collection.icon })
          }
          if (v.type === 'deleteRow') {
            if (metaRef.current.length === 0) {
              metaRef.current.push(v.metaId)
              setTimeout(() => {
                const ids = new Set(metaRef.current)
                metaRef.current = []
                const filtered = collection.items?.filter(i => i.id && !ids.has(i.id))
                CollectionStore.updateCollection({ id: collection.id, items: filtered })
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
