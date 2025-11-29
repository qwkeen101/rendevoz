import { useParams } from 'react-router-dom'
import { ObjectStore } from '@/api/stores'
import { memo, useMemo } from 'react'
import YoutubeLibraryRenderer from '@/core/components/youtube/YoutubeLibraryRenderer'
import YoutubeConsts from '@/core/components/youtube/YoutubeConsts'

export default memo(() => {
  const { id } = useParams()
  const folder = ObjectStore('youtubeFolder').useValue(Number(id))
  const { items } = folder || {}
  const key = YoutubeConsts.Search.Folder(Number(id))
  const categorized = useMemo(() => {
    if (!items) {
      return {
        videos: [],
        playlists: [],
        channels: []
      }
    }
    return {
      videos: items.filter(i => i.type === 'video').map(i => i.id),
      playlists: items.filter(i => i.type === 'playlist').map(i => i.id),
      channels: items.filter(i => i.type === 'channel').map(i => i.id)
    }
  }, [items])

  return (
    <YoutubeLibraryRenderer
      cacheKey={key}
      videoIds={categorized.videos}
      playlistIds={categorized.playlists}
      channelIds={categorized.channels}
      parentFolderId={Number(id)}
      name={folder?.name}
    />
  )
})
