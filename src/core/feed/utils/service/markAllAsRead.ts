import KeyvalueStore from '@/api/stores/keyvalue.store'
import { ObjectStore } from '@/api/stores'

export default async (itemIds: number[], collectionId?: number) => {
  const currentReadIds = (await KeyvalueStore.getOne('feedReadIds')) || []
  const idSet = new Set(currentReadIds)
  const unreadIds = itemIds.filter(i => !idSet.has(i))
  KeyvalueStore.updateOne('feedReadIds', [...currentReadIds, ...unreadIds])
  if (collectionId) {
    ObjectStore('feedCollection').updateOne({ id: collectionId, unreadCount: 0 })
  }
}
