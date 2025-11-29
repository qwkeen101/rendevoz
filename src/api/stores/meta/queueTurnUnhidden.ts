import { debounce } from 'lodash'
import { MetaStore, ObjectStore } from '@/api/stores'
import getHiddenBy, { IHiddenBy } from '@/api/stores/meta/getHiddenBy'

const queues: {
  groupId?: number
  metaId: number
  whiteboardId?: number
  type: 'group' | 'object'
  force?: boolean
}[] = []

const debounceCheckIfHidden = debounce(async () => {
  const hiddenByMap = await getHiddenBy()
  queues.forEach(async item => {
    const hiddenBy = hiddenByMap.get(item.metaId)
    // no other hide this object
    if (!hiddenBy) {
      MetaStore.updateMetaObject({ id: item.metaId, hidden: false })
    } else if (item.force) {
      await Promise.allSettled(
        hiddenBy.map(async h => {
          await forceDeleteHiddenBy(item.metaId, h)
        })
      )
      MetaStore.updateMetaObject({ id: item.metaId, hidden: false })
    }
  })
}, 1000)

export const forceDeleteHiddenBy = async (id: number, hiddenBy: IHiddenBy) => {
  switch (hiddenBy.type) {
    case 'whiteboard': {
      if (hiddenBy.objectId) {
        const whiteboard = await ObjectStore('whiteboard').getOneById(hiddenBy.objectId)
        if (whiteboard) {
          const nodes = Array.from(whiteboard.nodes?.values() || []).filter(i => i.type === 'metaObject' && i.metaObjectId === id)
          const nodeIds = new Set(nodes.map(i => i.id))
          const leftNodes = Array.from(whiteboard.nodes?.values() || []).filter(i => !(i.type === 'metaObject' && i.metaObjectId === id))
          const edges = Array.from(whiteboard.edges?.values() || []).filter(i => !nodeIds.has(i.targetId) && !nodeIds.has(i.sourceId))
          await ObjectStore('whiteboard').updateOne({
            id: whiteboard.id,
            nodes: new Map(leftNodes.map(i => [i.id, i])),
            edges: new Map(edges.map(i => [i.id, i]))
          })
        }
      }
      break
    }
    case 'attachment': {
      if (hiddenBy.metaId) {
        const meta = MetaStore.getCachedMetaObject(hiddenBy.metaId)
        if (meta) {
          await MetaStore.updateMetaObject({ id: hiddenBy.metaId, attachments: meta.attachments?.filter(i => i.id !== id) })
        }
      }
      break
    }
    case 'group': {
      if (hiddenBy.objectId) {
        const group = await ObjectStore('group').getOneById(hiddenBy.objectId)
        if (group) {
          await ObjectStore('group').updateOne({ id: group.id, values: group.values.filter(i => i.id !== id) })
        }
      }
      break
    }
  }
}

export default (item: (typeof queues)[0]) => {
  queues.push(item)
  debounceCheckIfHidden()
}
