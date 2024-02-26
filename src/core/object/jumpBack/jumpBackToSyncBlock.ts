import { MetaStore, NoteStore, ObjectStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'

export default async (syncBlockMetaId: number, targetMetaId: number) => {
  const syncBlockMeta = await MetaStore.getMetaObjectById(syncBlockMetaId)
  if (syncBlockMeta) {
    const targetMeta = await MetaStore.getMetaObjectById(targetMetaId)
    if (targetMeta) {
      if (targetMeta.type === 'note' && targetMeta.objectId) {
        const noteValue = await NoteStore.getNoteIdValue(targetMeta.objectId)
        const block = noteValue?.find(i => i.type === 'synced' && i.originId === syncBlockMeta.id)
        Rendevoz.Actions.Open.Editor.openEditor(targetMeta.objectId).then(i => {
          block &&
            i.scrollToBlock?.({
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

        Rendevoz.Actions.Open.Whiteboard.openWhiteboard(targetWhiteboard.id).then(i => {
          // if (syncNode) {
          //   setTimeout(() => {
          //     i.containerOps?.fitToNode(syncNode.id)
          //     i.selectOps?.selectNode(syncNode.id)
          //   }, 200)
          // }
        })
      }
    }
  }
}
