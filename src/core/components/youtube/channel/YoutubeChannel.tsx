import { useParams } from 'react-router-dom'
import { ObjectStore } from '@/api/stores'
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePopover, Icon, IconWithPopover, Menu, TabPane, Tabs, WithBorder } from '@/components'
import useYoutubeState from '@/core/components/youtube/hooks/useYoutubeState'
import { useUpdate } from 'react-use'
import { Colors, Icons } from '@/consts'
import YoutubeItemMenu from '@/core/components/youtube/YoutubeItemMenu'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { truncate } from 'lodash'
import ChannelHome from '@/core/components/youtube/channel/ChannelHome'
import ChannelVideos from '@/core/components/youtube/channel/ChannelVideos'
import ChannelPlaylists from '@/core/components/youtube/channel/ChannelPlaylists'
import ChannelFollowed from '@/core/components/youtube/channel/ChannelFollowed'
import useRenderMoreInfo from '@/core/components/youtube/components/useRenderMoreInfo'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import { Tab } from '@/components/base/tabs'
import { EmptyList, getImageMainColor, ImageWithBlur } from '@/core/components'
import useYoutubeData from '@/core/components/youtube/hooks/useYoutubeData'
import ClearSearchButton from '@/core/components/common/ClearSearchButton'
import useRenderGradientBg from '../../common/useRenderGradientBg'

export default memo(() => {
  const { id } = useParams()
  const channelId = id ? Number(id) : undefined
  const channel = ObjectStore('youtubeChannel').useValue(channelId)
  const update = useUpdate()
  const [state, setState] = useYoutubeState()
  const { t } = useTranslation()
  const [color, setColor] = useState<string>('')
  const cache = channel?.channelId ? state.dataCache.channel[channel.channelId] : undefined
  const tab = cache?.tab
  useLayoutEffect(() => {
    update()
  }, [])
  const instance = useYoutubeInstance()
  const { renderModal, renderMore } = useRenderMoreInfo({
    description: channel?.description,
    url: `https://www.youtube.com/channel/${channel?.channelId}`
  })
  const { followedPlaylists, followedVideos } = useYoutubeData()
  useEffect(() => {
    const action = async () => {
      const channelId = channel?.channelId
      if (!channelId) return
      const playlists = followedPlaylists?.length
        ? await Promise.all(followedPlaylists.map(async i => await ObjectStore('youtubePlaylist').fetchOneById(i)))
        : []
      const videos = followedVideos?.length
        ? await Promise.all(followedVideos.map(async i => await ObjectStore('youtubeVideo').fetchOneById(i)))
        : []
      const inChannelPlaylists = playlists.filter(i => i?.channelAppId === channel?.id)
      const inChannelVideos = videos.filter(i => i?.channelAppId === channel?.id)
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
  const moveToMenu = YoutubeItemMenu.useMoveToMenu({
    id: channelId!,
    type: 'channel'
  })
  const { renderMain, renderSub, mainHeight } = useRenderGradientBg(color)
  const followedCount = (cache?.followTab?.playlists?.length ?? 0) + (cache?.followTab?.videos?.length ?? 0)
  if (!channel) {
    return null
  }
  return (
    <>
      {renderModal()}
      <div className={'min-h-full flex flex-col relative'}>
        <div className='relative p-8 w-full' style={{ minHeight: mainHeight }}>
          {renderMain()}
          <div style={{ transform: 'translateZ(1px)' }} className={'flex gap-12 items-end'}>
            <ImageWithBlur
              onLoad={e => getImageMainColor(e, channel.thumbnail).then(res => setColor(res))}
              url={channel.thumbnail}
              className={'size-64 shadow-lg shrink-0 rounded-xl'}
            />
            <div className={'flex flex-col gap-2'}>
              <div>{t(trans.Feed.Channel)}</div>
              <div className={'text-5xl font-bold line-clamp-1'}>{channel.name}</div>
              <div className={'max-w-4xl'}>
                <span>{truncate(channel.description, { length: 200, omission: '' })}</span>
                {renderMore()}
              </div>
              <div className={'flex gap-6 mt-2 items-center'}>
                <div
                  onClick={() => {
                    instance.follow?.(channelId!, 'channel')
                  }}
                  className={'reverse-theme-button font-size-14 !px-5 flex items-center w-fit !rounded-full !py-1.5'}
                >
                  {channel.followed ? t(trans.Unfollow) : t(trans.Follow)}
                </div>
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
                    size={24}
                    strokeWidth={4}
                    className={'transition-colors cursor-pointer hover-primary-color transparent-font'}
                  ></Icon>
                </AnimatePopover>
              </div>
            </div>
          </div>
        </div>
        <div className='p-8 pt-6 w-full relative flex flex-col flex-1'>
          {renderSub()}
          <Tabs
            tabNavContainerClassname={
              '!justify-start h-10 mb-6 font-medium no-scrollbar !gap-2 w-full shrink-0 overflow-x-auto font-medium'
            }
            renderOnly
            container={false}
            activeKey={tab ?? 'home'}
            onTabClick={k => {
              const id = channel.channelId
              useYoutubeState.setChannelDataState(id, u => ({ ...u, tab: k }))
              if (cache?.search?.query) {
                if (k === 'playlists' && !cache?.search.playlistResults) {
                  setTimeout(() => instance.search?.(undefined, id))
                }
                if (k === 'videos' && !cache?.search.videoResults) {
                  setTimeout(() => instance.search?.(undefined, id))
                }
              }
            }}
            extra={
              <ClearSearchButton
                width={200}
                size={18}
                className='hover-active-button !transition-colors'
                onChange={v => {
                  const id = channel.channelId
                  useYoutubeState.setChannelDataState(id, u => ({ ...u, search: { query: v, isLoadingMore: false } }))
                  instance.search?.(undefined, id)
                }}
                query={cache?.search?.query ?? ''}
              />
            }
            tabNavClassname={'shrink-0 !pl-0 !pr-6 font-size-15'}
          >
            <TabPane tab={t(trans.Home)} key={'home'} className={'grow flex flex-col'}>
              <ChannelHome channelId={channel.channelId} />
            </TabPane>
            <TabPane tab={t(trans.Feed.Videos)} key={'videos'} className={'grow flex flex-col'}>
              <ChannelVideos channelId={channel.channelId} />
            </TabPane>
            <TabPane tab={t(trans.Feed.Playlists)} key={'playlists'} className={'grow flex flex-col'}>
              <ChannelPlaylists channelId={channel.channelId} />
            </TabPane>
            <TabPane mount tab={<Tab text={t(trans.Follow)} count={followedCount} />} key={'follow'} className={'grow flex flex-col'}>
              <ChannelFollowed channelAppId={channel.id} channelId={channel.channelId} />
            </TabPane>
          </Tabs>
        </div>
      </div>
    </>
  )
})
