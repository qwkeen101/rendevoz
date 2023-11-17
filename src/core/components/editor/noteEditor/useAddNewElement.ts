import { MetaStore, ObjectStore } from '@/api/stores'
import { CustomElement } from '~/typings'
import Id from '@/utils/id'

const useAddNewElement = (noteId?: number) => {
  const note = ObjectStore('note').useValue(noteId)
  const noteMeta = MetaStore.useValue(note?.metaId || 0)
  const handleAddNewElement = async (elementType: CustomElement['type']) => {
    if (!noteId) return
    if (elementType === 'sync') {
      if (!noteMeta) return
      const syncedBlockMeta = (
        await ObjectStore('syncedBlock').addOneWithMeta(
          {
            syncVersion: 1,
            syncedMetaIds: [noteMeta.id],
            blockChildren: [{ type: 'paragraph', id: Id.getId(), children: [{ text: '' }] }]
          },
          { silent: true }
        )
      ).meta
      if (syncedBlockMeta) {
        return {
          type: 'synced',
          children: [{ text: '' }],
          syncVersion: 0,
          originId: syncedBlockMeta.id,
          id: Id.getId()
        }
      }
    }
  }
  return handleAddNewElement
}

export default useAddNewElement
