import { ObjectStore } from '@/api/stores'
import { useEffect, useRef } from 'react'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { waitFor } from '@/utils'
/**
 * Retresh all collection contents
 */

export default () => {
  const instance = useFeedInstance()
  const intervalRef = useRef<NodeJS.Timeout>()
  useEffect(() => {
    waitFor(
      () => !!instance.feedOps?.refreshCollectionContent,
      () => {
        updateAllFeeds()
        // fetch every minute
        const interval = setInterval(() => {
          updateAllFeeds()
        }, 60 * 1000)
        intervalRef.current = interval
      }
    )
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
  const updateAllFeeds = async () => {
    const allCollections = await ObjectStore('feedCollection').fetchAll()
    allCollections.forEach(c => {
      const lastFetched = c.lastFetchedAt
      // sync every 6 hours
      if (!lastFetched || Date.now() - lastFetched > 1000 * 60 * 60 * 6) {
        instance.feedOps?.refreshCollectionContent(c.id)
        ObjectStore('feedCollection').updateOne({ id: c.id, lastFetchedAt: Date.now() })
      }
    })
  }
}
