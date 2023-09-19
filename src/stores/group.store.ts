import { globalStore, MetaStore, ObjectStore } from '@/stores'
import { debounce } from 'lodash'
import { MetaGroup } from '~/typings'
import Id from '@/utils/id'
import { atom } from 'jotai'

export const GroupToBelongsMetaIdMapAtom = atom(new Map())

export const MetaIdToGroupAtom = atom(new Map<number, number>())
document.addEventListener('DOMContentLoaded', () => {
  const GroupsAtom = ObjectStore('group').objectMapAtom
  const debouncedFn = debounce(() => {
    const GroupToBelongsMetaIdMap = globalStore.get(GroupToBelongsMetaIdMapAtom)
    const MetaIdToGroup = globalStore.get(MetaIdToGroupAtom)
    GroupToBelongsMetaIdMap.clear()
    MetaIdToGroup.clear()
    const allGroups = Array.from(globalStore.get(GroupsAtom).values())
    allGroups.forEach(g => {
      if (g.belongsTo) {
        GroupToBelongsMetaIdMap.set(g.id, g.belongsTo)
        MetaIdToGroup.set(g.belongsTo, g.id)
      }
    })
    globalStore.set(MetaIdToGroupAtom, new Map(MetaIdToGroup))
    globalStore.set(GroupToBelongsMetaIdMapAtom, new Map(GroupToBelongsMetaIdMap))
  }, 500)
  globalStore.sub(GroupsAtom, () => debouncedFn())
})
const GroupStore = {
  getGroupByMetaId: (id: number) => globalStore.get(ObjectStore('group').objectMapAtom).get(globalStore.get(MetaIdToGroupAtom).get(id) || 0),
  getMetaByGroupId: (id: number) => MetaStore.getMetaObjectsMap().get(globalStore.get(GroupToBelongsMetaIdMapAtom).get(id)),
  initializeGroup: () => {
    return {
      childrenMetaIds: [],
      id: Id.getId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      value: [],
      renderMode: 'table',
      rootFilterGroup: {
        groupType: 'and',
        rules: [],
        filterType: 'group'
      },
      tableProperties: {
        headers: [],
        visibleProperties: [],
        hiddenProperties: [],
        wrapColumns: false
      }
    } as MetaGroup
  }
}

export default GroupStore
