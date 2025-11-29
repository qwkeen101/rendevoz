import useYoutubeData from '@/core/components/youtube/hooks/useYoutubeData'
import { memo } from 'react'
import { ObjectStore } from '@/api/stores'
import YoutubeLibraryRenderer from '@/core/components/youtube/YoutubeLibraryRenderer'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import YoutubeConsts from '@/core/components/youtube/YoutubeConsts'

export default memo(() => {
  const sk = YoutubeConsts.Search.Library
  const { t } = useTranslation()
  const allFolders = ObjectStore('youtubeFolder').useAllKeys()
  const { followedChannels, followedPlaylists, followedVideos } = useYoutubeData()
  return (
    <YoutubeLibraryRenderer
      cacheKey={sk}
      playlistIds={followedPlaylists}
      channelIds={followedChannels}
      videoIds={followedVideos}
      folderIds={allFolders}
      name={t(trans.Feed.Library)}
    />
  )
})
