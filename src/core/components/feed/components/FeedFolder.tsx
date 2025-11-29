import { useParams } from 'react-router-dom'
import { ObjectStore } from '@/api/stores'
import FeedLibraryRenderer from '@/core/components/feed/components/FeedLibraryRenderer'
import { useMemo } from 'react'

export default () => {
  const { id } = useParams()
  const folderId = id ? Number(id) : undefined
  const folder = ObjectStore('feedFolder').useValue(folderId)

  const scrollKey = `feed_folder_${id}`
  const feedIds = useMemo(() => folder?.feeds || [], [folder?.feeds])
  if (!folder) return null
  return (
    <FeedLibraryRenderer
      parentFolderId={folderId}
      feeds={feedIds}
      collections={folder.collections}
      cacheKey={scrollKey}
      name={folder.name}
    />
  )
}
