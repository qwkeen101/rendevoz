import { RefObject, useLayoutEffect } from 'react'
import useYoutubeState from '@/core/components/feed/youtube/useYoutubeState'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { useNorepeatNavigate } from '@/hooks'
import YoutubeServices from '@/core/components/feed/youtube/YoutubeServices'
import toast from 'react-hot-toast'
import { Icon } from '@/components'
import { Icons } from '@/consts'
import YoutubeVideos from '@/core/components/feed/youtube/YoutubeVideos'

export default ({
  channelId,
  scrollElementRef,
  channelAppId
}: {
  channelId: string
  scrollElementRef: RefObject<HTMLDivElement>
  channelAppId: number
}) => {
  const [state, setState] = useYoutubeState()
  const cache = state.dataCache.channel[channelId].videoTab
  const items = cache?.items ?? []
  const token = cache?.token
  const instance = useFeedInstance()

  const handleLoad = async () => {
    if (cache?.isLoadingMore) return
    setVideoState(s => ({ ...s, isLoadingMore: true }))
    try {
      const res = await YoutubeServices.getVideosOfChannel(channelId, { token, details: true })
      setVideoState(s => ({
        ...s,
        isLoadingMore: false,
        token: res?.token,
        hasMore: !!res?.token,
        items: [...(s?.items ?? []), ...(res?.items || [])]
      }))
    } catch (e) {
      toast.error('Failed to load video!')
      setVideoState(s => ({ ...s, failed: true }))
    } finally {
      setVideoState(s => ({ ...s, isLoadingMore: false }))
    }
  }
  useLayoutEffect(() => {
    if (!cache?.items) {
      handleLoad()
    }
  }, [])
  const setVideoState = (updater: (curr: typeof cache) => Partial<typeof cache>) => {
    setState(s => ({
      ...s,
      dataCache: {
        ...s.dataCache,
        channel: {
          ...s.dataCache.channel,
          [channelId]: {
            ...s.dataCache.channel[channelId],
            videoTab: updater(s.dataCache.channel[channelId]?.videoTab)
          }
        }
      }
    }))
  }
  if (cache?.failed) {
    return (
      <div className={'w-full grow flex items-center justify-center'}>
        <div onClick={handleLoad} className={'reverse-theme-button py-2 !px-8'}>
          Retry
        </div>
      </div>
    )
  }
  if (!cache?.items) {
    return (
      <div className={'w-full grow flex items-center justify-center'}>
        <Icon name={Icons.Loading} spin size={40} />
      </div>
    )
  }

  if (cache.items && !cache.items.length) {
    return (
      <div className={'w-full grow flex items-center justify-center'}>
        <div className={'transparent-font font-semibold'}>No video</div>
      </div>
    )
  }
  return (
    <YoutubeVideos
      hasMore={!!cache?.hasMore}
      scrollKey={`youtube_channel_${channelAppId}`}
      scrollElementRef={scrollElementRef}
      items={items}
      onNavigate={i => {
        instance.youtubeOps
          ?.addVideo(i.snippet.resourceId.videoId, {
            history: true,
            channelHistory: channelAppId
          })
          .then(res => {
            instance.youtubeOps?.goTo(res.id, 'video')
          })
      }}
      onLoadMore={handleLoad}
    />
  )
}
