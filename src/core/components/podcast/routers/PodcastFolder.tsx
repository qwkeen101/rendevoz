import { memo } from 'react'
import { ObjectStore } from '@/api/stores'
import { useLocation, useParams } from 'react-router-dom'
import PodcastLibraryRenderer from '@/core/components/podcast/components/PodcastLibraryRenderer'

export default memo(() => {
  const { id } = useParams()
  const path = useLocation().pathname
  const folder = ObjectStore('podcastFolder').useValue(Number(id))
  return (
    <PodcastLibraryRenderer
      name={folder?.name}
      podcasts={folder?.podcasts}
      episodes={folder?.episodes}
      parentFolderId={Number(id)}
      cacheKey={path}
    />
  )
})
