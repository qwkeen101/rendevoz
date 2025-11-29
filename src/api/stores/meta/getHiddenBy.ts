import { MetaStore, ObjectStore } from '@/api/stores'

export type IHiddenBy = {
  type: 'whiteboard' | 'group' | 'attachment'
  objectId?: number
  metaId: number
}
export default async () => {
  const allMetas = Array.from(MetaStore.getMetaObjectsMap().values())
  const groups = (
    await ObjectStore('group').getMultipleByIds(
      allMetas
        .filter(i => i.type === 'group')
        .map(i => i.objectId)
        .filter(i => i) as number[],
      false
    )
  ).filter(i => i.hideObjectsInside)
  const whiteboards = (
    await ObjectStore('whiteboard').getMultipleByIds(
      allMetas
        .filter(i => i.type === 'whiteboard')
        .map(i => i.objectId)
        .filter(i => i) as number[],
      false
    )
  ).filter(i => i.hideObjects)
  const idToHiddenBy = new Map<number, IHiddenBy[]>()
  groups.forEach(g => {
    const groupMeta = MetaStore.getMetaObjectByObjectId(g.id, false)
    if (!groupMeta) return
    g.values.forEach(v => {
      if (v.type === 'metaObject') {
        idToHiddenBy.set(v.id, [
          ...(idToHiddenBy.get(v.id) || []),
          {
            type: 'group',
            objectId: g.id,
            metaId: groupMeta.id
          }
        ])
      }
    })
  })
  whiteboards.forEach(w => {
    const whiteboardMeta = MetaStore.getMetaObjectByObjectId(w.id, false)
    if (!whiteboardMeta) return
    w.nodes?.forEach(n => {
      if (n.type === 'metaObject') {
        idToHiddenBy.set(n.metaObjectId, [
          ...(idToHiddenBy.get(n.metaObjectId) || []),
          {
            type: 'whiteboard',
            objectId: w.id,
            metaId: whiteboardMeta.id
          }
        ])
      }
    })
  })
  allMetas.forEach(m => {
    m.attachments?.forEach(a => {
      if (a.type !== 'attachmentText') {
        idToHiddenBy.set(a.id, [
          ...(idToHiddenBy.get(a.id) || []),
          {
            type: 'attachment',
            metaId: m.id
          }
        ])
      }
    })
  })
  return idToHiddenBy
}
