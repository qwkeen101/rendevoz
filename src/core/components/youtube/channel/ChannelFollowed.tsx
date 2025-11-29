import YoutubeTabButton from '@/core/components/feed/youtube/components/YoutubeTabButton'
import useYoutubeState from '@/core/components/feed/youtube/useYoutubeState'
import { ObjectStore } from '@/api/stores'
import useYoutubeData from '@/core/components/feed/youtube/useYoutubeData'
import { useEffect } from 'react'
import YoutubeSearchResultRenderer from '@/core/components/feed/youtube/YoutubeSearchResultRenderer'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { capitalize } from 'lodash'
import { useElementScrollRestore } from '@/components'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'

export default ({ channelAppId, channelId, onChange }: { channelAppId: number; channelId: string; onChange: (value: number) => void }) => {
  const [state, setState] = useYoutubeState()
  const cache = state.dataCache.channel[channelId]?.followTab ?? {}
  const defaultTab = cache?.tab ?? 'videos'
  const { followedPlaylists, followedVideos } = useYoutubeData()
  const { playlists, videos } = cache
  const { t } = useTranslation()
  useEffect(() => {
    const action = async () => {
      const playlists = followedPlaylists?.length
        ? await Promise.all(followedPlaylists.map(async i => await ObjectStore('youtubePlaylist').fetchOneById(i)))
        : []
      const videos = followedVideos?.length
        ? await Promise.all(followedVideos.map(async i => await ObjectStore('youtubeVideo').fetchOneById(i)))
        : []
      const inChannelPlaylists = playlists.filter(i => i?.channelAppId === channelAppId)
      const inChannelVideos = videos.filter(i => i?.channelAppId === channelAppId)
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
                playlists: inChannelPlaylists.map(i => i!.id),
                videos: inChannelVideos.map(i => i!.id)
              }
            }
          }
        }
      }))
    }
    action()
  }, [followedPlaylists, followedVideos])
  useEffect(() => {
    if (playlists?.length || videos?.length) {
      onChange((playlists?.length ?? 0) + (videos?.length ?? 0))
      return
    }
    onChange(0)
  }, [playlists, videos])
  const instance = useFeedInstance()
  const renderTab = () => {
    return (
      <div className={'-mt-4 py-3 flex gap-3 pl-2 z-10 bg-global'}>
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
      return (
        <div className={'w-full grow flex items-center justify-center'}>
          <div className={'transparent-font font-semibold'}>{t(trans.NoResult)}</div>
        </div>
      )
    }
    return (
      <div className={'pb-40'}>
        {defaultTab === 'videos'
          ? items.map(i => (
              <YoutubeSearchResultRenderer.VideoRenderer
                onClick={() => {
                  instance.youtubeOps?.goTo(i, 'video')
                }}
                id={i}
                key={i}
              />
            ))
          : items.map(i => (
              <YoutubeSearchResultRenderer.PlaylistRenderer
                onClick={() => {
                  instance.youtubeOps?.goTo(i, 'playlist')
                }}
                id={i}
                key={i}
              />
            ))}
      </div>
    )
  }

  return (
    <>
      {renderTab()}
      {renderMain()}
    </>
  )
}
