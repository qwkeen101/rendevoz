import { useLayoutEffect } from 'react'
import useYoutubeState from '@/core/components/youtube/hooks/useYoutubeState'
import YoutubeServices from '@/core/components/youtube/YoutubeServices'
import { DotLoading } from '@/components'
import YoutubePlaylist from '@/core/components/youtube/YoutubePlaylists'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import { EmptyList, NoResult } from '@/core/components'

export default ({ channelId }: { channelId: string }) => {
  const [state] = useYoutubeState()
  const dataCache = state.dataCache.channel[channelId]
  const cache = dataCache?.playlistTab
  const search = dataCache?.search
  const items = search?.query ? search?.playlistResults?.map(i => ({ ...i, id: i.id.playlistId })) : cache?.items
  const token = cache?.token
  const instance = useYoutubeInstance()
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
  if (!items) {
    return (
      <div className={'w-full grow flex items-center justify-center'}>
        <DotLoading />
      </div>
    )
  }
  if (items && !items.length) {
    return <EmptyList />
  }
  if (!instance.scrollElementRef) return null
  return (
    <YoutubePlaylist
      showChannel={false}
      hasMore={search?.query ? !!search.playlistHasMore : !!cache?.hasMore}
      scrollElementRef={instance.scrollElementRef}
      items={items}
      onLoadMore={() => {
        if (search?.query) {
          instance.search?.(undefined, channelId)
          return
        }
        handleLoad()
      }}
    />
  )
}
