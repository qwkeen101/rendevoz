import keyvalueStore from '@/api/stores/keyvalue.store'
import { ObjectStore } from '@/api/stores'

export default async (itemId: number, collectionId?: number) => {
  const allRead = (await keyvalueStore.getOne('feedReadIds')) || []
  if (allRead.includes(itemId)) {
    const newAllRead = allRead.filter(i => i !== itemId)
    const readIdSet = new Set(newAllRead)
    keyvalueStore.updateOne('feedReadIds', newAllRead)
    if (collectionId) {
      const c = await ObjectStore('feedCollection').getOneById(collectionId)
      if (c) {
        const items = c.items
        const unread = items.filter(i => !readIdSet.has(i)).length
        ObjectStore('feedCollection').updateOne({ id: collectionId, unreadCount: unread })
      }
    }
  }
}