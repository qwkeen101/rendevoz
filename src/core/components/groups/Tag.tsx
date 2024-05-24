import { memo, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { MetaStore, ObjectStore } from '@/api/stores'
import GroupStore from '../../../api/stores/group.store'
import { useTranslation } from 'react-i18next'
import { Content, Icon } from '@/components'
import MetaGroup from '@/core/components/group/MetaGroup'
import { calculateSortObjects } from '@/core/object/filter/BetterSorter'
import TabTitle from '@/components/layout/TabTitle'
import { useDebounceFn } from '@/hooks'

function TagGroup({ id }: { id: number }) {
  const workspace = KeyvalueStore.useValue('currentWorkspace')
  const tagGroup = KeyvalueStore.useValue(`tag_${id}_${workspace?.id}_group`)
  const tagMetaIds = MetaStore.useIndexedMetaObjects()?.tagToMetaObjectIdsMap.get(id)
  const tagMetas = MetaStore.useMultipleObjects(Array.from(tagMetaIds || []))
  const tag = ObjectStore('tag').useValue(id)
  const [data, setData] = useState(
    tagGroup ?? {
      ...GroupStore.initializeGroup(),
      hideObjectsInside: false,
      hideGroupsInside: false,
      autoAddto: 'first'
    }
  )
  useLayoutEffect(() => {
    if (tagGroup) {
      setData(s => ({ ...s, ...tagGroup, values: s.values }))
    }
  }, [tagGroup])
  useEffect(() => {
    if (tagMetas) {
      const filtered = tagMetas.filter(i => !i.deleted && i.tags?.includes(id))
      const sorted = calculateSortObjects(filtered, {
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
  }, [tagMetas])

  const debounce = useDebounceFn(() => {
    MetaStore.triggerObjectIndex()
  })
  if (!tag) {
    ObjectStore('tag')
      .getOneById(id)
      .then(res => {
        if (!res) {
          KeyvalueStore.deleteOne(`tag_${id}_${workspace}_group`)
        }
      })
  }
  return (
    <Content fullHeight fullWidth>
      <TabTitle title={tag?.name || 'Unnamed tag'} icon={<Icon name={'park-tag-one'} />} />
      <MetaGroup
        title={useMemo(
          () => ({
            title: tag?.name || 'Unnamed tag',
            icon: 'park-tag-one',
            titleEditable: true
          }),
          [tag]
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
            const metaMap = MetaStore.getMetaObjectsMap()
            setData(v.value)
            if (v.value.values !== data.values) {
              v.value.values?.forEach(i => {
                const m = metaMap.get(i.id)?.tags
                if (!m?.includes(id)) {
                  MetaStore.updateMetaObject({
                    id: i.id,
                    tags: [...(m || []), id]
                  })
                }
              })
            }
            console.log(v.value)
            KeyvalueStore.updateOne(`tag_${id}_${workspace?.id}_group`, v.value)
          }
          if (v.type === 'groupMetaChange') {
            ObjectStore('tag').updateOne({ id, name: v.value.name })
          }
          if (v.type === 'deleteRow') {
            const m = MetaStore.getMetaObjectsMap().get(v.metaId)
            if (m) {
              debounce.run()
              MetaStore.updateMetaObject({
                id: v.metaId,
                tags: m.tags?.filter(i => i !== id)
              })
            }
          }
        }}
      />
    </Content>
  )
}

export default memo(TagGroup)
