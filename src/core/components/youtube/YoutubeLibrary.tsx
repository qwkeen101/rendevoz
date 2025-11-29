import useYoutubeData from '@/core/components/feed/youtube/useYoutubeData'
import { memo} from 'react'
import { ObjectStore } from '@/api/stores'
import YoutubeLibraryRenderer from '@/core/components/feed/youtube/YoutubeLibraryRenderer'

export default memo(() => {
  const sk = 'youtube_library'

  const allFolders = ObjectStore('youtubeFolder').useAllKeys()
  const { followedChannels, followedPlaylists, followedVideos } = useYoutubeData()
  return (
    <YoutubeLibraryRenderer
      cacheKey={sk}
      playlistIds={followedPlaylists}
      channelIds={followedChannels}
      videoIds={followedVideos}
      folderIds={allFolders}
    />
  )
})
