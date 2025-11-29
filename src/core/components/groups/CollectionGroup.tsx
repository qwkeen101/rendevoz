import { CollectionStore, MetaStore } from '@/api/stores'
import MetaGroup from '@/core/components/group/MetaGroup'
import { Content, Icon } from '@/components'
import TabTitle from '@/components/layout/TabTitle'
import { useEffect, useMemo, useRef, useState } from 'react'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import GroupStore from '../../../api/stores/group.store'
import { MetaObject } from '~/typings'
import { Icons } from '@/consts'

export default ({ id }: { id: number }) => {
  const collection = CollectionStore.useValue(id)
  const collectionGroup = KeyvalueStore.useValue(`collection_${id}_group`)
  const [data, setData] = useState(
    collectionGroup ?? {
      ...GroupStore.initializeGroup(),
      hideObjectsInside: true,
      hideGroupsInside: true,
      autoAddto: 'first'
    }
  )
  useEffect(() => {
    if (collection?.items) {
      const metas = collection.items
        .map(i => (i.type === 'meta' ? MetaStore.getCachedMetaObject(i.id) : MetaStore.getMetaObjectByObjectId(i.id)))
        .filter(i => i && !i.deleted) as MetaObject[]
      setData(s => ({ ...s, values: metas.reverse().map(i => ({ rowId: i.id, type: 'metaObject', id: i.id })) }))
    }
  }, [collection?.items])
  const metaRef = useRef<number[]>([])

  if (!collection) return null
  return (
    <Content fullHeight fullWidth>
      <TabTitle title={collection?.name} icon={<Icon name={Icons.Folder} />} />
      <MetaGroup
        title={{
          title: collection?.name,
          titleEditable: true
        }}
        state={{
          canHideGroupsInside: true,
          canDrag: true,
          canHideObjectsInside: false,
          canDragInside: true,
          canTurnHiddenIntoUnhidden: false
        }}
        layout={{
          showDeletedMetas: false,
          showDescription: false,
          showTitleActions: false,
          showCollection: true
        }}
        styles={useMemo(
          () => ({
            titleContainerStyle: {
              paddingTop: 42
            }
          }),
          []
        )}
        value={{ ...data, ...collectionGroup, values: data.values }}
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
