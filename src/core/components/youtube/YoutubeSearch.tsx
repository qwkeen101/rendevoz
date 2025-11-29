import { Fragment, memo, useLayoutEffect, useRef } from 'react'
import useYoutubeState from '@/core/components/feed/youtube/useYoutubeState'
import SearchInput from '@/core/components/feed/components/FeedSearchInput'
import FeedSearchInput from '@/core/components/feed/components/FeedSearchInput'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import YoutubeSearchResultRenderer from '@/core/components/feed/youtube/YoutubeSearchResultRenderer'
import classnames from 'classnames'
import VirtualLoader from '@/core/components/feed/youtube/components/VirtualLoader'
import { Icon, useElementScrollRestore } from '@/components'
import { Icons } from '@/consts'
import { useNorepeatNavigate } from '@/hooks'
import { useUpdate } from 'react-use'
import YoutubeTabButton from '@/core/components/feed/youtube/components/YoutubeTabButton'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import ContextMenu from '@/components/contextMenu'
import YoutubeItemMenu from '@/core/components/feed/youtube/YoutubeItemMenu'
import { capitalize } from 'lodash'

export default memo(() => {
  const [state, setState] = useYoutubeState()
  const cache = state.search
  const instance = useFeedInstance()
  const defaultTab = cache?.tab ?? 'all'
  const { t } = useTranslation()
  const update = useUpdate()
  useLayoutEffect(() => {
    update()
  }, [])
  const switchTab = (t: 'all' | 'video' | 'channel' | 'playlist') => {
    if (t === defaultTab) return
    setState(s => ({ ...s, search: { ...s.search, tab: t, results: undefined, token: undefined, hasMore: false, isLoadingMore: false } }))
    setTimeout(() => {
      instance.youtubeOps?.search(t)
    })
  }
  const ref = useRef<HTMLDivElement>(null)
  useElementScrollRestore({
    elementKey: 'youtube_search',
    elementRef: ref,
    disable: true
  })
  const renderMain = () => {
    if (cache?.isLoadingMore && !cache.results) {
      return (
        <div className={'w-full grow flex items-center justify-center'}>
          <Icon name={Icons.Loading} spin size={40} />
        </div>
      )
    }
    if (!cache?.results?.length || !cache?.query) {
      return (
        <div className={'w-full grow flex items-center justify-center'}>
          <div className={'transparent-font font-semibold'}>{t(trans.NoResult)}</div>
        </div>
      )
    }
    return (
      <VirtualLoader
        className={'pb-40'}
        renderItem={idx => {
          const i = cache?.results?.[idx]
          console.log(i, idx)
          if (i) {
            console.log(i, idx)
            return (
              <div>
                {i.id.kind === 'youtube#video' && (
                  <YoutubeSearchResultRenderer.VideoRenderer
                    onClick={() => {
                      instance.youtubeOps
                        ?.addVideo(i.id.videoId, {
                          history: true
                        })
                        .then(res => {
                          instance.youtubeOps?.goTo(res.id, 'video')
                        })
                    }}
                    item={i}
                  />
                )}
                {i.id.kind === 'youtube#playlist' && (
                  <YoutubeSearchResultRenderer.PlaylistRenderer
                    onClick={() => {
                      instance.youtubeOps?.addPlaylist(i.id.playlistId).then(res => {
                        instance.youtubeOps?.goTo(res.id, 'playlist')
                      })
                    }}
                    item={i}
                  />
                )}
                {i.id.kind === 'youtube#channel' && (
                  <YoutubeSearchResultRenderer.ChannelRenderer
                    onNavigate={() => {
                      instance.youtubeOps?.addChannel(i.id.channelId).then(res => {
                        instance.youtubeOps?.goTo(res.id, 'channel')
                      })
                    }}
                    item={i}
                  />
                )}
              </div>
            )
          }
          return null
        }}
        count={cache?.results?.length ?? 0}
        size={200}
        scrollKey={'youtube_search'}
        hasMore={cache?.hasMore}
        scrollElementRef={ref}
        onLoadMore={() => {
          instance.youtubeOps?.search(defaultTab)
        }}
        overscan={5}
      ></VirtualLoader>
    )
  }
  return (
    <div ref={ref} className={'w-full h-full overflow-y-auto p-6 pt-0'}>
      <div className={'min-h-full flex flex-col w-full max-w-7xl mx-auto'}>
        <div className={'sticky top-0 pt-4 pb-3 pl-2 gap-4 flex flex-col bg-global z-10'}>
          <FeedSearchInput
            autoFocus
            value={cache?.query ?? ''}
            onChange={v => {
              setState(s => ({ ...s, search: { ...s.search, query: v } }))
            }}
            onSubmit={() => {
              setState(s => ({ ...s, search: { ...s.search, token: undefined, isLoadingMore: false, hasMore: false, results: undefined } }))
              setTimeout(() => {
                instance.youtubeOps?.search()
              })
            }}
          />
          <div className={'flex items-center gap-4'}>
            {[
              {
                k: 'all',
                text: t(trans.Feed.all)
              },
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
              <YoutubeTabButton
                name={i.text}
                key={i.k}
                isActive={i.k === defaultTab}
                onClick={() => {
                  switchTab(i.k)
                }}
              />
            ))}
          </div>
        </div>
        {renderMain()}
      </div>
    </div>
  )
})
