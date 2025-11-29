import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import { memo, useMemo } from 'react'
import { ObjectStore } from '@/api/stores'
import PodcastLibraryRenderer from '@/core/components/podcast/components/PodcastLibraryRenderer'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { useLocation } from 'react-router-dom'

export default memo(() => {
  const { followedEpisodes, followedPodcasts } = usePodcastData()
  const path = useLocation().pathname
  const folders = ObjectStore('podcastFolder').useAll()
  const folderIds = useMemo(() => folders.map(i => i.id), [folders])
  const { t } = useTranslation()
  return (
    <PodcastLibraryRenderer
      episodes={followedEpisodes}
      podcasts={followedPodcasts}
      folderTab
      folders={folderIds}
      cacheKey={path}
      name={t(trans.Feed.Library)}
      createFolder
    />
  )
})
