import { useParams } from 'react-router-dom'
import { ObjectStore } from '@/api/stores'
import useYoutubeState from '@/core/components/feed/youtube/useYoutubeState'
import { memo, useLayoutEffect, useRef } from 'react'
import YoutubeServices from '@/core/components/feed/youtube/YoutubeServices'
import YoutubeVideos from '@/core/components/feed/youtube/YoutubeVideos'
import { useUpdate } from 'react-use'
import { AnimatePopover, Button, Icon, IconWithPopover, Menu, useElementScrollRestore, WithBorder } from '@/components'
import { Icons } from '@/consts'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import YoutubeItemMenu from '@/core/components/feed/youtube/YoutubeItemMenu'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import useRenderMoreInfo from '@/core/components/feed/youtube/components/useRenderMoreInfo'

export default memo(() => {
  const { id } = useParams()
  const playlistAppId = id ? Number(id) : undefined
  const playlist = ObjectStore('youtubePlaylist').useValue(playlistAppId)
  const [state, setState] = useYoutubeState()
  const cache = playlist ? state.dataCache.playlist[playlist.playlistId] : undefined
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const channel = ObjectStore('youtubeChannel').useValue(playlist?.channelAppId)
  const update = useUpdate()
  useElementScrollRestore({
    elementRef: scrollElementRef,
    elementKey: `youtube_playlist_app_${playlistAppId}`
  })
  useLayoutEffect(() => {
    update()
  }, [])
  console.log(cache)
  const handleLoad = async () => {
    const token = cache?.videoTab?.token
    const playlistId = playlist?.playlistId
    if (!playlistId) return
    if (cache?.videoTab?.isLoadingMore) return
    useYoutubeState.setPlaylistDataState(playlistId, s => ({ ...s, videoTab: { ...s?.videoTab, isLoadingMore: true } }))
    try {
      const res = await YoutubeServices.getVideosOfPlaylist(playlistId, {
        token,
        details: true
      })
      if (res) {
        useYoutubeState.setPlaylistDataState(playlistId, s => ({
          ...s,
          videoTab: { ...s?.videoTab, token: res.token, hasMore: !!res.token, items: [...(s?.videoTab?.items || []), ...res.items] }
        }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      useYoutubeState.setPlaylistDataState(playlistId, s => ({
        ...s,
        videoTab: { ...s?.videoTab, isLoadingMore: false }
      }))
    }
  }
  useLayoutEffect(() => {
    if (!cache?.videoTab?.items) {
      handleLoad()
    }
  }, [playlist?.id])
  const moveToMenu = YoutubeItemMenu.useMoveToMenu({
    id: playlistAppId!,
    type: 'playlist'
  })
  const { t } = useTranslation()
  const instance = useFeedInstance()
  const { renderModal, open } = useRenderMoreInfo({
    description: playlist?.description,
    url: `https://www.youtube.com/playlist?list=${playlist?.playlistId}`
  })
  if (!playlist) return null
  return (
    <div ref={scrollElementRef} className={'h-full overflow-y-auto w-full px-6'}>
      {renderModal()}
      <div className={'w-full max-w-7xl min-h-full flex py-6 flex-col mx-auto'}>
        <div className={'flex items-center gap-12'}>
          <img src={playlist.thumbnail} className={'rounded-xl w-72 aspect-video shadow-lg object-cover'} />
          <div className={'flex flex-col gap-3'}>
            <div className={'text-2xl font-bold line-clamp-2'}>{playlist.name}</div>
            {channel && (
              <div
                onClick={() =>
                  instance.youtubeOps?.goTo(channel.id, 'channel', {
                    initializeChannel: true
                  })
                }
                className={'flex items-center group cursor-pointer gap-2.5'}
              >
                {channel.thumbnail && <img src={channel.thumbnail} className={'w-7 h-7 rounded object-cover'} />}
                <div className={'font-medium'}>{channel.name}</div>
                <Icon strokeWidth={4} name={'park-right'} className={'group-hover:translate-x-1 transition-transform'} />
              </div>
            )}
            <div className={'gap-3 flex mt-1'}>
              <div
                onClick={() => {
                  playlistAppId && instance.youtubeOps?.follow(playlistAppId, 'playlist')
                }}
                className={'reverse-theme-button flex items-center w-fit !rounded-full !px-4 !py-1'}
              >
                {playlist.followed ? t(trans.Unfollow) : t(trans.Follow)}
              </div>
              <Button.IconButton
                text={t(trans.History)}
                icon={Icons.History}
                onClick={() => {
                  playlistAppId && instance.youtubeOps?.viewHistory(playlistAppId, 'playlist')
                }}
                className={'border-round-icon-button'}
              ></Button.IconButton>
              <AnimatePopover
                positions={['bottom', 'top']}
                content={setV => (
                  <WithBorder className={'menu-py min-w-56'}>
                    <Menu.NavigationMenu layout={moveToMenu(() => setV(false))} />
                  </WithBorder>
                )}
                padding={6}
              >
                <Button.IconButton
                  suffixIcon={'park-down'}
                  text={t(trans.Save)}
                  icon={Icons.ListAdd}
                  suffixIconClassName={'-ml-5 super-transparent-font'}
                  className={'border-round-icon-button !pr-2 !pl-3'}
                ></Button.IconButton>
              </AnimatePopover>
              <Icon
                name={'custom-info'}
                onClick={() => {
                  open()
                }}
                className={'border-round-button icon-18 !p-1.5'}
              />
            </div>
          </div>
        </div>
        <div className={'my-6 text-2xl font-bold'}>
          {t(trans.Feed.Videos)}
          {cache?.videoTab?.items?.length ? ` (${cache?.videoTab.items.length})` : ''}
        </div>
        {!cache?.videoTab?.items ? (
          <div className={'grow flex items-center justify-center'}>
            <Icon name={Icons.Loading} spin size={40} />
          </div>
        ) : (
          <YoutubeVideos
            hasMore={!!cache?.videoTab?.hasMore}
            onLoadMore={() => {
              handleLoad()
            }}
            onNavigate={i => {
              instance.youtubeOps
                ?.addVideo(i.snippet.resourceId.videoId, {
                  playlistAppId: playlist.id,
                  channelAppId: playlist?.channelAppId,
                  history: true
                })
                .then(res => {
                  if (res) {
                    instance.youtubeOps?.goTo(res.id, 'video')
                  }
                })
            }}
            items={cache?.videoTab?.items ?? []}
            scrollElementRef={scrollElementRef}
            scrollKey={`youtube_playlist_app_${playlistAppId}`}
          ></YoutubeVideos>
        )}
      </div>
    </div>
  )
})
