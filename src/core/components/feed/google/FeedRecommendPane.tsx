// use in home page, aggregated from followed feeds
import { ObjectStore } from '@/api/stores'
import { useEffect, useState } from 'react'
import useFeedData from '@/core/components/feed/hooks/useFeedData'
import { IFeedItem } from '~/typings'
import { orderBy } from 'lodash'

export default () => {
  const allCollections = ObjectStore('feedCollection').useAll()
  const history = useFeedData().history
  const [items, setItems] = useState<
    {
      feedId: number
      collectionId: number
    }[]
  >([])
  useEffect(() => {
    const action = async () => {
      const feedItems = (
        await Promise.all(
          allCollections.map(async i => ({
            collection: i,
            items: await Promise.all(i.items.map(async item => await ObjectStore('feed').fetchOneById(item)))
          }))
        )
      ).flat()
      const itemWithCollectionId: {
        feed: IFeedItem
        collectionId: number
      }[] = []
      feedItems.forEach(i => {
        i.items.forEach(item => {
          if (!item) return
          itemWithCollectionId.push({
            feed: item,
            collectionId: i.collection.id
          })
        })
      })
      const historySet = new Set(useFeedData.getData().history)
      const sortedFeedItems = orderBy(itemWithCollectionId, i => i.feed.date, 'desc')
      const notInHistoryItems = sortedFeedItems.filter(i => !historySet.has(i.feed.id))
      const sliced = notInHistoryItems.slice(0, 50)
      setItems(
        sliced.map(i => ({
          feedId: i.feed.id,
          collectionId: i.collectionId
        }))
      )
    }
  }, [])
}
