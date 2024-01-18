import { MetaStore, ObjectStore } from '@/api/stores'
import { CustomElement } from '~/typings'
import Id from '@/utils/id'

const useAddNewElement = (metaId?: number) => {
  const handleAddNewElement = async (elementType: CustomElement['type']) => {
    if (elementType === 'sync') {
      if (!metaId) return
      const syncedBlockMeta = (
        await ObjectStore('syncedBlock').addOneWithMeta(
          {
            syncVersion: 1,
            syncedMetaIds: [metaId],
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
