import { globalStore, MetaStore, ObjectStore } from '@/api/stores/index'
import { debounce } from 'lodash'
import { MetaGroup, MetaGroupChild } from '~/typings'
import Id from '@/utils/id'
import { atom } from 'jotai'
import { DEFAULT_GROUP_PROPERTIES } from '@/core/components/group/consts/defaultProperties'

export const GroupToBelongsMetaIdMapAtom = atom(new Map())

export const MetaIdToGroupAtom = atom(new Map<number, number>())

const GroupStore = {
  getGroupByMetaId: (id: number) =>
    globalStore.get(ObjectStore('group').objectMapAtom).get(globalStore.get(MetaIdToGroupAtom).get(id) || 0),
  getMetaByGroupId: (id: number) => MetaStore.getMetaObjectsMap().get(globalStore.get(GroupToBelongsMetaIdMapAtom).get(id)),
  insertMetaIntoGroup: async (metaId: number | number[], groupId: number) => {
    const group = await ObjectStore('group').getOneById(groupId)
    if (!group) return
    const metaIds = Array.isArray(metaId) ? metaId : [metaId]
    if (group.hideObjectsInside) {
      metaIds.forEach(id => {
        MetaStore.updateMetaObject({ id: id, hidden: true }, true)
      })
    }
    ObjectStore('group').updateOne({
      id: groupId,
      values: [...group.values, ...metaIds.map(id => ({ type: 'metaObject', id: id, rowId: Id.getId() }))]
    })
  },
  insertItemsIntoGroup: async (items: MetaGroupChild[], groupId: number) => {
    const group = await ObjectStore('group').getOneById(groupId)
    if (!group) return
    ObjectStore('group').updateOne({
      id: groupId,
      values: [...group.values, ...items]
    })
  },
  initializeGroup: () => {
    return {
      id: Id.getId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      properties: DEFAULT_GROUP_PROPERTIES,
      values: [],
      rootFilterGroup: {
        groupType: 'and',
        rules: [],
        filterType: 'group'
      },
      autoAddto: 'first',
      views: [
        {
          type: 'table',
          id: Id.getId(),
          name: 'Table',
          unToggledIds: [],
          valueIndex: [],
          options: {
            properties: Object.fromEntries(
              DEFAULT_GROUP_PROPERTIES.map((i, idx) => [
                i.id,
                {
                  width: 150,
                  visible: i.visible,
                  order: idx
                }
              ])
            )
          }
        }
      ],
      syncVersion: 1,
      hideGroupsInside: false,
      hideObjectsInside: true
    } as MetaGroup
  }
}

export default GroupStore
