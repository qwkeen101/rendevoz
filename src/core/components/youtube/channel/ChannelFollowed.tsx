import YoutubeTabButton from '@/core/components/youtube/components/YoutubeTabButton'
import useYoutubeState from '@/core/components/youtube/hooks/useYoutubeState'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { useElementScrollRestore } from '@/components'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import { EmptyList } from '@/core/components'
import YoutubeVideos from '@/core/components/youtube/YoutubeVideos'
import YoutubePlaylists from '@/core/components/youtube/YoutubePlaylists'

export default ({ channelAppId, channelId }: { channelAppId: number; channelId: string }) => {
  const [state, setState] = useYoutubeState()
  const cache = state.dataCache.channel[channelId]?.followTab ?? {}
  const defaultTab = cache?.tab ?? 'videos'
  const instance = useYoutubeInstance()
  const { playlists, videos } = cache
  const { t } = useTranslation()
  const renderTab = () => {
    return (
      <div className={'flex gap-3 pb-6'}>
        {[
          {
            key: 'videos',
            name: `${t(trans.Feed.Videos)}${videos?.length ? `(${videos.length})` : ''}`
          },
          {
            key: 'playlists',
            name: `${t(trans.Feed.Playlists)}${playlists?.length ? `(${playlists.length})` : ''}`
          }
        ].map(i => (
          <YoutubeTabButton
            name={i.name}
            key={i.key}
            isActive={defaultTab === i.key}
            onClick={() => {
              if (defaultTab !== i.key) {
                useElementScrollRestore.updatePosition(`youtube_channel_${channelAppId}`, 0)
              }
              // @ts-ignore
              setState(s => ({
                ...s,
                dataCache: {
                  ...s.dataCache,
                  channel: {
                    ...s.dataCache.channel,
                    [channelId]: {
                      ...s.dataCache.channel[channelId],
                      followTab: {
                        ...s.dataCache.channel[channelId]?.followTab,
                        tab: i.key
                      }
                    }
                  }
                }
              }))
            }}
          />
        ))}
      </div>
    )
  }
  const renderMain = () => {
    const items = defaultTab === 'videos' ? videos : playlists
    if (!items?.length) {
      return <EmptyList />
    }
    const ref = instance.scrollElementRef
    if (!ref) return null
    if (defaultTab === 'videos') {
      return <YoutubeVideos hasMore={false} onLoadMore={() => {}} scrollElementRef={ref} items={items} />
    }
    if (defaultTab === 'playlists') return <YoutubePlaylists hasMore={false} onLoadMore={() => {}} scrollElementRef={ref} items={items} />
  }

  return (
    <>
      {renderTab()}
      {renderMain()}
    </>
  )
}
