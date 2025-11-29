import { memo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ObjectStore } from '@/api/stores'
import Video from '@/core/components/media/wrappers/Video'
import { IYoutubeVideoItem } from '@/core/components/feed/youtube/YoutubeServices'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'

export default memo(() => {
  const { id } = useParams()
  const location = useLocation()
  const folderId = location.state?.folderId
  const videoId = id ? Number(id) : undefined
  const video = ObjectStore('youtubeVideo').useValue(videoId)
  const instance = useFeedInstance()
  if (!video) return null
  return (
    <Video
      on={async i => {
        if (i.type === 'pin') {
          instance.youtubeOps?.follow(video.id, 'video')
          return true
        }
      }}
      mediaState={{
        url: `https://www.youtube.com/embed/${video.videoId}`,
        name: video.name,
        description: video.description,
        thumbnail: video.thumbnail,
        layout: {
          ytFollow: true
        },
        styles: {
          containerPaddingTop: 'pt-4'
        },
        state: {
          ytFolderId: folderId,
          followed: video.followed,
          ytVideoId: video.id,
          ytPlaylistId: video.playlistAppId,
          ytChannelId: video.channelAppId
        }
      }}
    />
  )
})
