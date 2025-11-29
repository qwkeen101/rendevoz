import Video from '@/core/components/media/wrappers/Video'
import useYoutubeState from '@/core/components/youtube/hooks/useYoutubeState'
import { ObjectStore } from '@/api/stores'
import { useEffect, useRef, useState } from 'react'
import { IMediaInstance } from '~/index'

export default () => {
  const [state, setState] = useYoutubeState()
  const { currentVideo, isFocusing } = state
  const video = ObjectStore('youtubeVideo').useValue(currentVideo)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (isFocusing) {
      if (video?.id) {
        setTimeout(() => setVisible(true), 50)
        return
      }
    }
    setVisible(false)
  }, [isFocusing, video])

  useEffect(() => {
    ins.current?.actionOps?.pause()
  }, [visible])
  const ins = useRef<IMediaInstance | undefined>()
  if (!video) return null
  return (
    <Video
      onInstanceInitialized={i => {
        ins.current = i
      }}
      mediaState={{
        url: `https://www.youtube.com/embed/${video.videoId}`,
        name: video.name,
        description: video.description,
        thumbnail: video.thumbnail,
        autoPlay: true,
        websiteUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
        layout: {
          focusMode: {
            onClose: () => {
              setState(s => ({ ...s, isFocusing: false }))
            },
            style: {
              transform: visible ? 'translateY(0px)' : 'translateY(100%)',
              transition: 'transform 0.3s ease'
            }
          }
        },
        state: {
          followed: video.followed,
          ytVideoId: video.id,
          ytPlaylistId: video.playlistAppId,
          ytChannelId: video.channelAppId
        }
      }}
    />
  )
}
