import updateMovetoCache from '@/components/form/quickAdd/updateMovetoCache'
import { CollectionStore, GroupStore, MetaStore, NoteStore } from '@/api/stores'
import { Rendevoz } from '@/core/rendevoz'
import { getSetting } from '@/core'
import Id from '@/utils/id'

export default async (metaId: number | number[], type: 'note' | 'group' | 'collection' | 'tag', id: number) => {
  const setting = getSetting()
  metaId = Array.isArray(metaId) ? metaId : [metaId]
  if (type === 'note') {
    const noteValue = await NoteStore.getNoteIdValue(id)
    if (noteValue) {
      const notePosition = setting.quickAdd.addIntoNote
      const metaType = setting.quickAdd.noteMetaType
      const element =
        metaType === 'inline'
          ? [
              {
                type: 'paragraph',
                id: Id.getId(),
                children: [
                  { text: '' },
                  ...metaId.map(i => ({ type: 'inline-metaObject', id: Id.getId(), children: [{ text: '' }], originId: i })),
                  { text: '' }
                ]
              }
            ]
          : [...metaId.map(i => ({ type: 'metaObject', id: Id.getId(), children: [{ text: '' }], originId: i }))]
      const nextValue = notePosition === 'first' ? [...element, ...noteValue] : [...noteValue, ...element]
      updateMovetoCache(s => {
        s.note = { id }
        s.recently = s.recently ? [{ type: 'note', id }, ...s.recently.filter(i => i.id !== id)] : [{ type: 'note', id }]
      })
      await NoteStore.updateNoteValue(nextValue, id)
      const noteMeta = MetaStore.getMetaObjectByObjectId(id)
      if (noteMeta) {
        setTimeout(() => {
          if (setting.quickAdd.addIntoNoteAutoOpen) {
            Rendevoz.Actions.Open.Meta.openMetaObject(noteMeta.id)
          }
        })
        metaId.forEach(id => {
          MetaStore.addMetaLink({
            sourceId: id,
            targetId: noteMeta.id
          })
        })
      }
    }
  }
  if (type === 'group') {
    updateMovetoCache(s => {
      s.recently = s.recently ? [{ id, type: 'group' }, ...s.recently.filter(i => i.id !== id)] : [{ type: 'group', id }]
      s.group = {
        id
      }
    })
    const groupMeta = MetaStore.getMetaObjectByObjectId(id)
    GroupStore.insertMetaIntoGroup(metaId, id)
    if (groupMeta) {
      if (setting.quickAdd.addIntoGroupAutoOpen) {
        setTimeout(() => {
          Rendevoz.Actions.Open.Meta.openMetaObject(groupMeta.id)
        }, 100)
      }
      metaId.forEach(id => {
        MetaStore.addMetaLink({
          sourceId: id,
          targetId: groupMeta.id
        })
      })
    }
  }
  if (type === 'collection') {
    updateMovetoCache(s => {
      s.collection = { id }
      s.recently = s.recently ? [{ type: 'collection', id }, ...s.recently.filter(i => i.id !== id)] : [{ type: 'collection', id }]
    })
    CollectionStore.addItemToCollection(
      metaId.map(id => ({
        type: 'meta',
        id: id
      })),
      id
    )
  }
  if (type === 'tag') {
    updateMovetoCache(s => {
      s.recently = s.recently ? [{ type: 'tag', id }, ...s.recently.filter(i => i.id !== id)] : [{ type: 'tag', id }]
    })
    metaId.forEach(mid => {
      const m = MetaStore.getCachedMetaObject(mid)
      if (m && !m.tags?.includes(id)) {
        MetaStore.updateMetaObject({ id: mid, tags: [...(m.tags || []), id] })
      }
    })
  }
}
