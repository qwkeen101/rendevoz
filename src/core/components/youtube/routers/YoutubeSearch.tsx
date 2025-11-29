import { memo, useLayoutEffect, useRef } from 'react'
import useYoutubeState from '@/core/components/youtube/hooks/useYoutubeState'
import { DotLoading, TabPane, Tabs } from '@/components'
import { useUpdate } from 'react-use'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import { EmptyList } from '@/core/components'
import YoutubeVideos from '@/core/components/youtube/YoutubeVideos'
import YoutubePlaylists from '@/core/components/youtube/YoutubePlaylists'
import YoutubeChannels from '@/core/components/youtube/YoutubeChannels'

export default memo(() => {
  const [state, setState] = useYoutubeState()
  const cache = state.search
  const instance = useYoutubeInstance()
  const defaultTab = cache?.tab ?? 'video'
  const { t } = useTranslation()
  const update = useUpdate()
  useLayoutEffect(() => {
    update()
  }, [])
  const switchTab = (t: 'video' | 'channel' | 'playlist') => {
    if (t === defaultTab) return
    setState(s => ({
      ...s,
      search: { ...s.search, tab: t, results: undefined, token: undefined, hasMore: undefined, isLoadingMore: false }
    }))
    setTimeout(() => {
      instance.search?.(t)
    })
  }
  const ref = useRef<HTMLDivElement>(null)
  const scrollKey = 'youtube_search'
  const renderMain = () => {
    if (cache?.isLoadingMore && !cache.results?.length) {
      return (
        <div className={'w-full h-full flex items-center justify-center'}>
          <DotLoading />
        </div>
      )
    }
    if (!cache?.results?.length || !cache?.query) {
      return <EmptyList className='h-full' />
    }
    if (defaultTab === 'video')
      return (
        <YoutubeVideos
          hasMore={!!cache?.hasMore}
          onLoadMore={() => instance.search?.(defaultTab)}
          scrollKey={scrollKey}
          showChannel
          items={cache.results.map(i => ({ ...i, id: i.id.videoId }))}
          scrollElementRef={ref}
        />
      )
    if (defaultTab === 'playlist')
      return (
        <YoutubePlaylists
          hasMore={!!cache?.hasMore}
          onLoadMore={() => instance.search?.(defaultTab)}
          scrollKey={scrollKey}
          items={cache.results.map(i => ({ ...i, id: i.id.playlistId }))}
          scrollElementRef={ref}
        />
      )
    if (defaultTab === 'channel')
      return (
        <YoutubeChannels
          hasMore={!!cache?.hasMore}
          onLoadMore={() => instance.search?.(defaultTab)}
          scrollKey={scrollKey}
          items={cache.results.map(i => ({ ...i, id: i.id.channelId }))}
          scrollElementRef={ref}
        />
      )
  }
  return (
    <div className={'w-full flex flex-col h-full'}>
      <Tabs
        container={false}
        tabNavContainerClassname={'p-7 font-medium py-4'}
        tabNavClassname={'font-size-14 !pl-0 !pr-6'}
        onTabClick={k => switchTab(k)}
        activeKey={defaultTab}
      >
        {[
          {
            k: 'video',
            text: t(trans.Feed.Videos)
          },
          {
            k: 'channel',
            text: t(trans.Feed.Channels)
          },
          {
            k: 'playlist',
            text: t(trans.Feed.Playlists)
          }
        ].map(i => (
          <TabPane key={i.k} tab={i.text} />
        ))}
      </Tabs>
      <div className={'flex-1 w-full overflow-y-auto p-7 pt-0'} ref={ref}>
        {renderMain()}
      </div>
    </div>
  )
})
