import useFeedState from '@/core/feed/hooks/useFeedState'
import { globalStore, ObjectStore } from '@/stores'
import { useEffect } from 'react'
import useFetchFeeds from '@/core/feed/hooks/useFetchFeeds'
import KeyvalueStore from '@/stores/keyvalue.store'

/**
 * Retrieve and update state
 */
export default () => {
  const [feedState, setFeedState] = useFeedState()
  const lastFetched = KeyvalueStore.useValue('feedLastSyncTime')
  useEffect(() => {
    console.log(lastFetched, Date.now(), Date.now() - lastFetched)
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
    if (Date.now() - lastFetched > 24 * 60 * 60 * 1000) {
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
  const { fetchFeeds } = useFetchFeeds()
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
      const res = await fetchFeeds(collection.feedUrl, collection.collectionType)
      collection = await ObjectStore('feedCollection').getOneById(collectionId)
      if (collection) {
        const allItemUrls = await Promise.all(collection.items.map(async id => await ObjectStore('feed').getOneById(id)))
        const alreadyUrls = new Set(allItemUrls.map(i => i?.link))
        const filteredItems = res.items.filter(i => !alreadyUrls.has(i.link))
        const newItemIds = await Promise.all(filteredItems.map(async item => ObjectStore('feed').addOne({ ...item })))
        ObjectStore('feedCollection').updateOne({
          id: collectionId,
          items: [...newItemIds.map(i => i.id), ...collection.items],
          lastFetchedAt: Date.now()
        })
      }
    }
  }
  useEffect(() => {
    if (feedCollection?.items) {
      setFeedState(s => ({ ...s, allFeedItems: feedCollection.items }))
    }
  }, [feedCollection?.items])
}
