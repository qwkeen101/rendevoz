import { memo } from 'react'
import { ObjectStore } from '@/api/stores'
import FeedLibraryRenderer from '@/core/components/feed/components/FeedLibraryRenderer'
import useFeedData from '@/core/components/feed/hooks/useFeedData'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'

export default memo(() => {
  const feedCollections = ObjectStore('feedCollection').useAllKeys()
  const feedFolders = ObjectStore('feedFolder').useAllKeys()
  const key = '/feed/library'
  const followed = useFeedData().followedItems
  const { t } = useTranslation()
  return (
    <FeedLibraryRenderer name={t(trans.Feed.Library)} cacheKey={key} feeds={followed} folders={feedFolders} collections={feedCollections} />
  )
})
