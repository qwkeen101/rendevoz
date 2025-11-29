import { RefObject, useLayoutEffect } from 'react'
import useYoutubeState from '@/core/components/feed/youtube/useYoutubeState'
import YoutubeServices from '@/core/components/feed/youtube/YoutubeServices'
import { Icon } from '@/components'
import { Icons } from '@/consts'
import YoutubePlaylist from '@/core/components/feed/youtube/YoutubePlaylists'

export default ({
  channelId,
  scrollElementRef,
  channelAppId
}: {
  channelId: string
  scrollElementRef: RefObject<HTMLDivElement>
  channelAppId: number
}) => {
  const [state] = useYoutubeState()
  const cache = state.dataCache.channel[channelId].playlistTab
  const items = cache?.items ?? []
  const token = cache?.token
  const handleLoad = async () => {
    if (cache?.isLoadingMore) return
    useYoutubeState.setChannelDataState(channelId, curr => ({
      ...curr,
      playlistTab: {
        ...curr?.playlistTab,
        isLoadingMore: true
      }
    }))
    try {
      const res = await YoutubeServices.getPlaylistOfChannel(channelId, { token })
      useYoutubeState.setChannelDataState(channelId, curr => ({
        ...curr,
        playlistTab: {
          items: [...(curr?.playlistTab?.items || []), ...res.items],
          token: res.token,
          hasMore: !!res.token,
          isLoadingMore: false
        }
      }))
    } finally {
      useYoutubeState.setChannelDataState(channelId, curr => ({
        ...curr,
        playlistTab: {
          ...curr?.playlistTab,
          isLoadingMore: false
        }
      }))
    }
  }
  useLayoutEffect(() => {
    if (!cache?.items) {
      handleLoad()
    }
  }, [])
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
        <div className={'transparent-font font-semibold'}>No playlist</div>
      </div>
    )
  }
  console.log(cache)
  return (
    <YoutubePlaylist
      hasMore={!!cache?.hasMore}
      scrollKey={`youtube_channel_${channelAppId}`}
      scrollElementRef={scrollElementRef}
      items={items}
      onLoadMore={handleLoad}
    />
  )
}
