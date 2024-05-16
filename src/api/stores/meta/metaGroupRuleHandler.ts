import { GroupStore, MetaStore, ObjectStore } from '@/api/stores'
import { MetaGroup, MetaGroupChild } from '~/typings'
import { calculateFilterObjects } from '@/core/object/filter/useBetterFilter'
import Id from '@/utils/id'
import Node from '@/core/components/group/utils/node'

export default () => {
  const unhiddenMetasz = Array.from(MetaStore.getMetaObjectsMap().values()).filter(i => !i.hidden && !i.temp)
  const groupMetas = new Set(unhiddenMetasz.filter(i => i.type === 'group').map(i => i.objectId))
  const unhiddenMetas = unhiddenMetasz.map(i => i.id)
  ObjectStore('group')
    .fetchAll()
    .then(res => {
      const groups = res as MetaGroup[]
      groups.forEach(async g => {
        if (!groupMetas.has(g.id)) return
        // have automation rules
        if (g.rootFilterGroup?.rules?.length) {
          const correctObjects = await calculateFilterObjects(g.rootFilterGroup, unhiddenMetas)
          if (correctObjects?.length) {
            const items = correctObjects.map(i => ({
              id: i.id,
              type: 'metaObject',
              rowId: Id.getId()
            })) as MetaGroupChild[]
            const alreadyInGroupMetaIds = new Set(
              Node.elements({ children: g.values })
                .filter(i => i[0].type === 'metaObject')
                .map(i => i[0].id)
            )
            const finalItems = items.filter(i => !alreadyInGroupMetaIds.has(i.id))
            if (finalItems.length) {
              GroupStore.insertItemsIntoGroup(finalItems, g.id)
            }
            if (g.hideObjectsInside) {
              correctObjects.forEach(o => {
                if (o.type === 'group' && g.hideGroupsInside !== true) {
                  return
                }
                MetaStore.updateMetaObject({ id: o.id, hidden: true }, { silent: true })
              })
            }
          }
        }
      })
    })
}
