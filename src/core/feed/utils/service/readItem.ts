import keyvalueStore from '@/stores/keyvalue.store'
import { ObjectStore } from '@/stores'

export default async (itemId: number, collectionId?: number) => {
  const recentlyRead = ((await keyvalueStore.getOne('feedRecentlyReadIds')) || []).filter(i => i !== itemId)
  keyvalueStore.updateOne('feedRecentlyReadIds', [itemId, ...recentlyRead])
  const allRead = (await keyvalueStore.getOne('feedReadIds')) || []
  if (!allRead.includes(itemId)) {
    const newAllRead = [...allRead, itemId]
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
