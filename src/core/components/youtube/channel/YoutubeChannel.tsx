import { useParams } from 'react-router-dom'
import { ObjectStore } from '@/api/stores'
import { memo, RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  AnimatePopover,
  Button,
  Icon,
  IconWithPopover,
  Menu,
  Modal,
  TabPane,
  Tabs,
  useElementScrollRestore,
  WithBorder
} from '@/components'
import useYoutubeState from '@/core/components/feed/youtube/useYoutubeState'
import { useNorepeatNavigate } from '@/hooks'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import YoutubeServices, { IYoutubeVideoItem } from '@/core/components/feed/youtube/YoutubeServices'
import { useUpdate } from 'react-use'
import isHotkey from 'is-hotkey'
import { Icons, KEY } from '@/consts'
import classnames from 'classnames'
import YoutubeItemMenu from '@/core/components/feed/youtube/YoutubeItemMenu'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { truncate } from 'lodash'
import ChannelSearch from '@/core/components/feed/youtube/channel/ChannelSearch'
import ChannelHome from '@/core/components/feed/youtube/channel/ChannelHome'
import ChannelVideos from '@/core/components/feed/youtube/channel/ChannelVideos'
import ChannelPlaylists from '@/core/components/feed/youtube/channel/ChannelPlaylists'
import ChannelFollowed from '@/core/components/feed/youtube/channel/ChannelFollowed'
import useRenderMoreInfo from '@/core/components/feed/youtube/components/useRenderMoreInfo'

export default memo(() => {
  const { id, tab } = useParams()
  const channelId = id ? Number(id) : undefined
  const channel = ObjectStore('youtubeChannel').useValue(channelId)
  const navigate = useNorepeatNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const update = useUpdate()
  const [state, setState] = useYoutubeState()
  const [followTabVisible, setFollowTabVisible] = useState(0)
  const { t } = useTranslation()
  const moveToMenu = YoutubeItemMenu.useMoveToMenu({
    id: channelId!,
    type: 'channel'
  })
  const searchCache = channel?.channelId ? state.dataCache.channel[channel.channelId]?.search : undefined
  const setSearchState = (updater: (curr: typeof searchCache) => Partial<typeof searchCache>) => {
    if (channel?.channelId) {
      const id = channel?.channelId
      // @ts-ignore
      setState(s => ({
        ...s,
        dataCache: {
          ...s.dataCache,
          channel: {
            ...s.dataCache.channel,
            [id]: {
              ...s.dataCache.channel[id],
              search: {
                ...s.dataCache.channel[id]?.search,
                ...updater(s.dataCache.channel[id]?.search)
              }
            }
          }
        }
      }))
    }
  }
  useLayoutEffect(() => {
    update()
  }, [])
  useElementScrollRestore({
    elementKey: `youtube_channel_${channelId}`,
    elementRef: ref
  })
  const instance = useFeedInstance()
  const { renderModal, renderMore } = useRenderMoreInfo({
    description: channel?.description,
    url: `https://www.youtube.com/channel/${channel?.channelId}`
  })
  if (!channel) {
    return null
  }
  return (
    <div ref={ref} className={'w-full h-full overflow-y-auto px-6 pt-0'}>
      {renderModal()}
      <div className={'container-7xl py-6 min-h-full flex flex-col'}>
        <div className={'flex gap-12 mb-8 items-center'}>
          <img src={channel.thumbnail} className={'w-48 h-48 shrink-0 rounded-full'} />
          <div className={'flex flex-col gap-2'}>
            <div className={'text-3xl font-bold line-clamp-1'}>{channel.name}</div>
            <div className={'transparent-font max-w-4xl'}>
              <span>{truncate(channel.description, { length: 120, omission: '' })}</span>
              {renderMore()}
            </div>
            <div className={'flex gap-3 mt-2'}>
              <div
                onClick={() => {
                  instance.youtubeOps?.follow(channelId!, 'channel')
                }}
                className={'reverse-theme-button flex items-center w-fit !rounded-full !px-4 !py-1'}
              >
                {channel.followed ? t(trans.Unfollow) : t(trans.Follow)}
              </div>
              <Button.IconButton
                text={t(trans.History)}
                icon={Icons.History}
                onClick={() => {
                  instance.youtubeOps?.viewHistory(channelId!, 'channel')
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
            </div>
          </div>
        </div>
        <Tabs
          tabNavContainerClassname={
            '!justify-start !items-end mb-4 font-medium !sticky top-0 no-scrollbar !gap-2 w-full shrink-0 overflow-x-auto bg-global capitalize font-medium z-10'
          }
          extra={
            <div className={'flex gap-3 ml-3 mb-0.5 focus-within-input border-box-shadow rounded-full px-3 font-normal py-1'}>
              <Icon
                onClick={() => {
                  setSearchState(s => ({ ...s, visible: !s?.visible }))
                }}
                className={classnames('icon-18 cursor-pointer !rounded-full', !searchCache?.visible && 'transparent-font')}
                name={Icons.Search}
              />
              <input
                placeholder={t(trans.Search)}
                defaultValue={searchCache?.query}
                onBlur={() => {
                  if (!searchCache?.query) {
                    setSearchState(s => ({
                      ...s,
                      visible: false
                    }))
                  }
                }}
                onKeyDown={e => {
                  if (isHotkey(KEY.Enter, e) && channel) {
                    setSearchState(s => ({
                      ...s,
                      query: e.currentTarget.value,
                      token: undefined,
                      isLoadingMore: true
                    }))
                    YoutubeServices.search(e.currentTarget.value, {
                      channelId: channel?.channelId,
                      type: ['video', 'playlist'],
                      stats: true,
                      details: true
                    }).then(res => {
                      if (!res) return
                      setSearchState(s => ({
                        ...s,
                        token: res.token,
                        results: res.items,
                        hasMore: !!res.token,
                        isLoadingMore: false
                      }))
                    })
                    navigate(`/youtube/channel/${id}/search`)
                  }
                }}
              />
            </div>
          }
          container={false}
          onTabClick={k => {
            navigate(`/youtube/channel/${id}/${k}`, { replace: true })
            if (k !== (tab ?? 'home')) {
              ref.current?.scrollTo({
                top: 0
              })
              useElementScrollRestore.updatePosition(`youtube_channel_${channelId}`, 0)
            }
          }}
          activeKey={tab ?? 'home'}
          tabNavMode={'underline'}
          tabNavClassname={'shrink-0 !pb-1.5 !pt-3 !px-3'}
        >
          <TabPane tab={t(trans.Home)} key={'home'} className={'grow flex flex-col'}>
            <ChannelHome channelId={channel.channelId} channelAppId={channel.id} />
          </TabPane>
          <TabPane tab={t(trans.Feed.Videos)} key={'videos'} className={'grow flex flex-col'}>
            <ChannelVideos channelAppId={channel.id} scrollElementRef={ref} channelId={channel.channelId} />
          </TabPane>
          <TabPane tab={t(trans.Feed.Playlists)} key={'playlists'} className={'grow flex flex-col'}>
            <ChannelPlaylists channelAppId={channel.id} channelId={channel.channelId} scrollElementRef={ref} />
          </TabPane>
          <TabPane
            mount
            tab={`${t(trans.Follow)}${followTabVisible ? `(${followTabVisible})` : ''}`}
            key={'follow'}
            className={'grow flex flex-col'}
          >
            <ChannelFollowed onChange={v => setFollowTabVisible(v)} channelAppId={channel.id} channelId={channel.channelId} />
          </TabPane>
          <TabPane tab={t(trans.Search)} key={'search'} className={'grow flex flex-col'}>
            <ChannelSearch scrollElementRef={ref} channelAppId={channel.id} channelId={channel.channelId} />
          </TabPane>
        </Tabs>
      </div>
    </div>
  )
})
