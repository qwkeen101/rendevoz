import { RefObject } from 'react'
import useYoutubeState from '@/core/components/feed/youtube/useYoutubeState'
import { useNorepeatNavigate } from '@/hooks'
import YoutubeServices from '@/core/components/feed/youtube/YoutubeServices'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import classnames from 'classnames'
import { Icon, useElementScrollRestore } from '@/components'
import { Icons } from '@/consts'
import VirtualLoader from '@/core/components/feed/youtube/components/VirtualLoader'
import YoutubeSearchResultRenderer from '@/core/components/feed/youtube/YoutubeSearchResultRenderer'
import YoutubeTabButton from '@/core/components/feed/youtube/components/YoutubeTabButton'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { capitalize } from 'lodash'

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
  const setSearchState = (updater: (curr: typeof searchCache) => Partial<typeof searchCache>) => {
    const id = channelId
    useYoutubeState.setChannelDataState(id, curr => ({ ...curr, search: { ...curr?.search, ...updater(curr?.search) } }))
  }
  const navigate = useNorepeatNavigate()
  const searchCache = state.dataCache.channel[channelId].search
  console.log(searchCache)
  const items = searchCache?.results
  const defaultTab = searchCache?.tab ?? 'all'
  const { t } = useTranslation()
  const handleLoad = (initialize?: boolean, tab?: string) => {
    if (searchCache?.isLoadingMore) return
    if (tab) {
      const currentTab = searchCache?.tab ?? 'all'
      if (currentTab === tab) return
    }
    if (initialize) {
      scrollElementRef.current?.scrollTo({
        top: 0
      })
      useElementScrollRestore.updatePosition(`youtube_channel_${channelAppId}`, 0)
      setSearchState(s => ({ ...s, token: undefined, hasMore: false, results: undefined, isLoadingMore: !!s?.query, tab: tab ?? s?.tab }))
    }
    if (searchCache?.query) {
      if (!initialize) {
        setSearchState(s => ({ ...s, isLoadingMore: true }))
      }
      const t = tab ?? searchCache?.tab
      let type: string[] = []
      if (!t || t === 'all') {
        type = ['video', 'playlist']
      }
      if (t === 'videos') {
        type = ['video']
      }
      if (t === 'playlists') {
        type = ['playlist']
      }
      YoutubeServices.search(searchCache.query, {
        channelId: channelId,
        token: initialize ? undefined : searchCache.token,
        type,
        details: true,
        stats: true
      })
        .then(res => {
          if (!res) return
          // @ts-ignore
          setSearchState(s => ({
            ...s,
            results: [...(s?.results || []), ...res.items],
            token: res.token,
            hasMore: !!res.token
          }))
        })
        .catch(e => {
          console.error(e)
        })
        .finally(() => {
          setSearchState(s => ({ ...s, isLoadingMore: false }))
        })
    }
  }
  const switchTab = (t: 'all' | 'videos' | 'playlists') => {
    handleLoad(true, t)
  }
  const instance = useFeedInstance()
  const renderMain = () => {
    if (searchCache?.query && !items) {
      return (
        <div className={'w-full grow flex items-center justify-center'}>
          <Icon name={Icons.Loading} spin size={40} />
        </div>
      )
    }
    if (!items || !items.length) {
      return (
        <div className={'w-full grow flex items-center justify-center'}>
          <div className={'transparent-font font-semibold'}>{t(trans.NoResult)}</div>
        </div>
      )
    }
    return (
      <VirtualLoader
        className={'pb-40'}
        count={items?.length ?? 0}
        scrollKey={`youtube_channel_${channelAppId}`}
        size={150}
        renderItem={idx => {
          const i = items?.[idx]
          if (i) {
            return (
              <>
                {i.id.kind === 'youtube#video' && (
                  <YoutubeSearchResultRenderer.VideoRenderer
                    onClick={() => {
                      instance.youtubeOps
                        ?.addVideo(i?.id.videoId, {
                          history: true
                        })
                        .then(res => {
                          instance.youtubeOps?.goTo(res.id, 'video')
                        })
                    }}
                    item={i}
                    key={i.etag}
                  />
                )}
                {i.id.kind === 'youtube#playlist' && (
                  <YoutubeSearchResultRenderer.PlaylistRenderer
                    onClick={() => {
                      instance.youtubeOps?.addPlaylist(i?.id.playlistId).then(res => {
                        instance.youtubeOps?.goTo(res.id, 'playlist')
                      })
                    }}
                    item={i}
                    key={i.etag}
                  />
                )}
              </>
            )
          }
          return null
        }}
        hasMore={searchCache?.hasMore}
        scrollElementRef={scrollElementRef}
        onLoadMore={handleLoad}
      ></VirtualLoader>
    )
  }
  return (
    <>
      <div className={'-mt-4 py-3 flex gap-3 pl-2 z-10 bg-global'}>
        {['all', 'videos', 'playlists'].map(i => (
          <YoutubeTabButton
            key={i}
            name={t(trans.Feed[i === 'all' ? i : capitalize(i)])}
            isActive={defaultTab === i}
            onClick={() => {
              switchTab(i)
            }}
          />
        ))}
      </div>
      {renderMain()}
    </>
  )
}
