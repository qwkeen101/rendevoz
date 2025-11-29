import { MetaStore, NoteStore, ObjectStore } from '@/api/stores'

export default async (syncBlockMetaId: number, targetMetaId: number) => {
  const syncBlockMeta = await MetaStore.getMetaObjectById(syncBlockMetaId)
  if (syncBlockMeta) {
    const targetMeta = await MetaStore.getMetaObjectById(targetMetaId)
    if (targetMeta) {
      if (targetMeta.type === 'note' && targetMeta.objectId) {
        const noteValue = await NoteStore.getNoteIdValue(targetMeta.objectId)
        const block = noteValue?.find(i => 'type' in i && i.type === 'synced' && i.originId === syncBlockMeta.id)
        Global.layoutOps?.openObject<'editor'>(targetMeta.id).then(i => {
          block &&
            i?.scrollToBlock?.({
              blockId: block.id,
              highlight: true
            })
        })
      }
      if (targetMeta.type === 'whiteboard' && targetMeta.objectId) {
        const targetWhiteboard = await ObjectStore('whiteboard').getOneById(targetMeta.objectId)
        if (!targetWhiteboard) return
        const syncNode = Array.from(targetWhiteboard?.nodes?.values() || []).find(
          i => i.type === 'metaObject' && i.metaObjectId === syncBlockMeta.id
        )
        Global.layoutOps?.openObject<'whiteboard'>(targetMeta.id).then(i => {
          if (syncNode && i) {
            setTimeout(() => {
              i.containerOps?.fitToNode(syncNode.id)
              i.selectOps?.selectNode(syncNode.id)
            }, 200)
          }
        })
      }
    }
  }
}
