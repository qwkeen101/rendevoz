import { useParams } from 'react-router-dom'
import { ObjectStore } from '@/api/stores'
import useYoutubeState from '@/core/components/youtube/hooks/useYoutubeState'
import { memo, useLayoutEffect, useState } from 'react'
import YoutubeServices from '@/core/components/youtube/YoutubeServices'
import YoutubeVideos from '@/core/components/youtube/YoutubeVideos'
import { AnimatePopover, Button, DotLoading, Icon, Menu, WithBorder } from '@/components'
import { Colors, Icons } from '@/consts'
import YoutubeItemMenu from '@/core/components/youtube/YoutubeItemMenu'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import { getImageMainColor, ImageWithBlur } from '@/core/components'
import classnames from 'classnames'
import useRenderGradientBg from '../../common/useRenderGradientBg'

export default memo(() => {
  const { id } = useParams()
  const playlistAppId = id ? Number(id) : undefined
  const playlist = ObjectStore('youtubePlaylist').useValue(playlistAppId)
  const [state, setState] = useYoutubeState()
  const cache = playlist ? state.dataCache.playlist[playlist.playlistId] : undefined
  const channel = ObjectStore('youtubeChannel').useValue(playlist?.channelAppId)
  const [color, setColor] = useState<string>('')
  const { renderMain, renderSub, mainHeight } = useRenderGradientBg(color)
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
  const instance = useYoutubeInstance()
  const scrollElementRef = instance.scrollElementRef
  if (!playlist) return null
  return (
    <>
      <div className={'w-full min-h-full flex flex-col'}>
        <div className='relative p-8'>
          {renderMain()}
          <div style={{ transform: 'translateZ(1px)' }} className={'flex items-end gap-10'}>
            <ImageWithBlur
              url={playlist.thumbnail}
              onLoad={e => getImageMainColor(e, playlist.thumbnail).then(res => setColor(res))}
              className={'rounded-2xl w-96 aspect-video shrink-0'}
            />
            <div className={'flex flex-col pb-4'}>
              <div className={'mb-2'}>{t(trans.Feed.Playlist)}</div>
              <div className={'text-4xl font-bold line-clamp-2'}>{playlist.name}</div>
              {channel && (
                <div
                  onClick={() => instance.load?.(channel?.channelId, 'channel')}
                  className={'flex items-center group mt-4 cursor-pointer gap-2'}
                >
                  {channel.thumbnail && <img src={channel.thumbnail} className={'size-6 rounded-full object-cover'} />}
                  <div className={'font-medium'}>{channel.name}</div>
                  {cache?.videoTab?.items?.length ? (
                    <>
                      <div className={'font-size-13 leading-none'}>•</div>
                      <div
                        className={'font-size-13 leading-none'}
                      >{`${t('feed.VideoCount', { count: cache?.videoTab.items.length })}`}</div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className='p-8 relative flex flex-col flex-1'>
          {renderSub()}
          <div style={{ transform: 'translateZ(1px)' }} className={'gap-6 flex mb-8'}>
            <Button.IconButton
              icon={'park-play-one'}
              theme={'filled'}
              size={20}
              onClick={() => {
                const first = cache?.videoTab?.items?.[0]
                if (first) {
                  instance.load?.(first.id, 'video')
                }
              }}
              text={t('general.Play')}
              className={'reverse-theme-button !gap-2 !pl-4 !pr-5 !rounded-3xl'}
            ></Button.IconButton>
            <Icon
              onClick={() => {
                playlistAppId && instance.follow?.(playlistAppId, 'playlist')
              }}
              theme={playlist.followed ? 'filled' : undefined}
              name={'park-like'}
              size={26}
              className={classnames(
                'transition-colors cursor-pointer',
                playlist.followed ? 'text-red-500' : 'hover-primary-color transparent-font'
              )}
            >
              {playlist.followed ? t(trans.Unfollow) : t(trans.Follow)}
            </Icon>
            <AnimatePopover
              positions={['bottom', 'top']}
              content={setV => (
                <WithBorder className={'menu-py min-w-56'}>
                  <Menu.NavigationMenu layout={moveToMenu(() => setV(false))} />
                </WithBorder>
              )}
              padding={6}
            >
              <Icon
                name={Icons.Create}
                size={26}
                className={'transition-colors cursor-pointer hover-primary-color transparent-font'}
              ></Icon>
            </AnimatePopover>
          </div>
          {!cache?.videoTab?.items ? (
            <div className={'grow flex w-full items-center justify-center'}>
              <DotLoading />
            </div>
          ) : (
            <YoutubeVideos
              hasMore={!!cache?.videoTab?.hasMore}
              onLoadMore={() => {
                handleLoad()
              }}
              onNavigate={i => {
                console.log(i)
                instance.load?.(i, 'video', {
                  playlistAppId: playlist.id,
                  channelAppId: playlist?.channelAppId
                })
              }}
              items={cache?.videoTab?.items ?? []}
              scrollElementRef={scrollElementRef}
            ></YoutubeVideos>
          )}
        </div>
      </div>
    </>
  )
})
