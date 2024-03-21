import useFeedState from '@/core/components/feed/hooks/useFeedState'
import { globalStore, GroupStore, MetaStore, ObjectStore } from '@/api/stores'
import { useEffect } from 'react'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import universalFeedFetcher from '@/core/components/feed/utils/universalFeedFetcher'
import transformItemsIntoMetas from '@/core/components/feed/utils/service/transformItemsIntoMetas'

/**
 * Retrieve and update state
 */

export default () => {
  const [feedState, setFeedState] = useFeedState()
  const lastFetched = KeyvalueStore.useValue('feedLastSyncTime')
  const readRule = KeyvalueStore.useValue('feedReadRule') || 'all'
  const alreadyRead = KeyvalueStore.useValue('feedReadIds') || []
  useEffect(() => {
    if (!lastFetched) {
      setFeedState(s => ({ ...s, isSyncing: true }))
      updateAllFeeds()
        .then(() => {
          KeyvalueStore.updateOne('feedLastSyncTime', Date.now())
        })
        .finally(() => {
          setFeedState(s => ({ ...s, isSyncing: false }))
        })
      return
    }
    if (Date.now() - lastFetched > 6 * 60 * 60 * 1000) {
      setFeedState(s => ({ ...s, isSyncing: true }))
      updateAllFeeds()
        .then(() => {
          KeyvalueStore.updateOne('feedLastSyncTime', Date.now())
        })
        .finally(() => {
          setFeedState(s => ({ ...s, isSyncing: false }))
        })
    }
  }, [lastFetched])
  const feedCollection = ObjectStore('feedCollection').useValue(feedState.currentCollectionId)
  const updateAllFeeds = async () => {
    await ObjectStore('feedCollection').getAll()
    const allFeedCollections = Array.from(globalStore.get(ObjectStore('feedCollection').objectMapAtom).values())
    await Promise.all(
      allFeedCollections.map(async i => {
        await fetchMoreItemsForCollection(i.id)
      })
    )
  }
  const fetchMoreItemsForCollection = async (collectionId: number) => {
    let collection = await ObjectStore('feedCollection').getOneById(collectionId)
    if (collection && collection.feedUrl) {
      const res = await universalFeedFetcher(collection.feedUrl, collection.collectionType)
      if (!res) return
      collection = await ObjectStore('feedCollection').getOneById(collectionId)
      if (collection) {
        const allItemUrls = await Promise.all(collection.items.map(async id => await ObjectStore('feed').getOneById(id)))
        const alreadyUrls = new Set(allItemUrls.map(i => i?.link))
        const filteredItems = res.items.filter(i => !alreadyUrls.has(i.link))
        const newItemIds = await Promise.all(filteredItems.map(async item => ObjectStore('feed').addOne({ ...item })))
        if (collection.relatedGroups?.length) {
          const newMetas = await transformItemsIntoMetas(newItemIds.map(i => i.id))
          collection.relatedGroups.forEach(i => {
            const m = MetaStore.getCachedMetaObject(i)
            if (m && !m.deleted) {
              GroupStore.insertMetaIntoGroup(
                newMetas.map(i => i.id),
                m.objectId!
              )
            }
          })
        }
        ObjectStore('feedCollection').updateOne({
          id: collectionId,
          items: [...newItemIds.map(i => i.id), ...collection.items],
          lastFetchedAt: Date.now(),
          unreadCount: (collection.unreadCount || 0) + newItemIds.length
        })
      }
    }
  }
  useEffect(() => {
    if (feedCollection?.items) {
      const readIdSet = new Set(alreadyRead)
      const unreadCount = feedCollection.items.filter(i => !readIdSet.has(i)).length
      ObjectStore('feedCollection').updateOne({ id: feedCollection.id, unreadCount })
      if (readRule === 'all') {
        Promise.all(feedCollection.items.map(async i => await ObjectStore('feed').getOneById(i))).then(() => {
          setFeedState(s => ({ ...s, allFeedItems: feedCollection.items, filteredFeedItems: undefined }))
        })
      } else {
        Promise.all(feedCollection.items.map(async i => await ObjectStore('feed').getOneById(i))).then(() => {
          setFeedState(s => ({
            ...s,
            allFeedItems: feedCollection.items,
            filteredFeedItems: feedCollection.items.filter(i => !readIdSet.has(i))
          }))
        })
      }
    }
  }, [feedCollection?.id, readRule])
}
