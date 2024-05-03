import { ITag, IWhiteboardNode, MetaObject } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'

export type ContainResult = {
  meta: MetaObject
  contains: number
}
export type ContainResults = {
  group: ContainResult[]
  whiteboard: ContainResult[]
  video: ContainResult[]
  audio: ContainResult[]
  pdf: ContainResult[]
  webpage: ContainResult[]
  note: ContainResult[]
}
const removeRepeatNum = (nums: number[]) => Array.from(new Set(nums).values())
export default async (m: MetaObject, realtime = false): Promise<MetaObject[] | undefined> => {
  const metaMap = MetaStore.getMetaObjectsMap()
  const isAvailable = (id: number) => {
    const m = metaMap.get(id)
    if (m && !m.deleted) {
      return true
    }
    return false
  }
  switch (m.type) {
    case 'whiteboard': {
      if (m.objectId) {
        const whiteboard = await ObjectStore('whiteboard').fetchOneById(m.objectId)
        if (whiteboard) {
          const metas = (
            (whiteboard.nodes && whiteboard.nodes instanceof Map
              ? Array.from(whiteboard.nodes.values())
              : Array.isArray(whiteboard.nodes)
              ? whiteboard.nodes
              : []) || []
          )
            .filter(i => i.type === 'metaObject')
            .map(i => i.metaObjectId)
            .filter(id => isAvailable(id))
          if (metas.length) {
            return removeRepeatNum(metas).map(id => metaMap.get(id)!)
          }
        }
      }
      break
    }
    case 'note': {
      if (m.objectId) {
        const note = await ObjectStore('note').fetchOneById(m.objectId)
        if (note) {
          const inside = (note.insideMetas ? Object.keys(note.insideMetas).map(i => Number(i)) : []).filter(i => isAvailable(i))
          const labels = (note.labels?.map(i => MetaStore.getMetaObjectByObjectId(i, realtime)).filter(i => i && isAvailable(i.id)) ||
            []) as MetaObject[]
          const has = inside.length + labels.length
          if (has) {
            return removeRepeatNum([...inside, ...labels.map(i => i.id)]).map(i => metaMap.get(i)!)
          }
        }
      }
      break
    }
    case 'group': {
      if (m.objectId) {
        const group = await ObjectStore('group').fetchOneById(m.objectId)
        if (group) {
          const metas = group.values.map(i => i.id).filter(i => isAvailable(i))
          if (metas.length) {
            return removeRepeatNum(metas).map(i => metaMap.get(i)!)
          }
        }
      }
      break
    }
    case 'webpage':
    case 'audio':
    case 'video':
    case 'pdf':
      {
        if (m.objectId) {
          const obj = await ObjectStore(m.type).fetchOneById(m.objectId)
          if (obj && obj.labels?.length) {
            const labels = obj.labels
              .map(i => MetaStore.getMetaObjectByObjectId(i, realtime))
              .filter(i => i && isAvailable(i.id)) as MetaObject[]
            if (labels.length) {
              return removeRepeatNum(labels.map(i => i.id)).map(i => metaMap.get(i)!)
            }
          }
        }
      }
      break
  }
}
