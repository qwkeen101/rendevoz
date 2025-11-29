import { memo, useEffect, useLayoutEffect, useRef } from 'react'
import useYoutubeData from '@/core/components/feed/youtube/useYoutubeData'
import { Icon, TabPane, Tabs, useElementScrollRestore } from '@/components'
import YoutubeDashboardPane from '@/core/components/feed/youtube/YoutubeDashboradPane'
import useYoutubeState from '@/core/components/feed/youtube/useYoutubeState'
import FeedSearchInput from '@/core/components/feed/components/FeedSearchInput'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { useNorepeatNavigate, useUpdateEffect } from '@/hooks'
import { ObjectStore } from '@/api/stores'
import { useUpdate } from 'react-use'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { Icons } from '@/consts'
import classnames from 'classnames'

export default memo(() => {
  const data = useYoutubeData()
  const { dashboard, followedChannels, followedPlaylists } = data
  const [state, setState] = useYoutubeState()
  const instance = useFeedInstance()
  const update = useUpdate()
  useLayoutEffect(() => {
    update()
  }, [])
  useEffect(() => {
    ObjectStore('youtubeFolder').getAll()
  }, [])
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (dashboard.activeTopic === 'my playlists' || dashboard.activeTopic === 'my channels') return
    if (!dashboard.topicToChannels[dashboard.activeTopic]?.items?.length) {
      useYoutubeData.fetchDashboardTopicChannels(dashboard.activeTopic)
    }
  }, [dashboard.activeTopic])
  useUpdateEffect(() => {
    ref.current?.scrollTo({
      top: 0
    })
    useElementScrollRestore.updatePosition(scrollKey, 0)
  }, [dashboard.activeTopic])
  const { t } = useTranslation()
  const scrollKey = 'youtube_dashboard'
  const navigate = useNorepeatNavigate()
  useElementScrollRestore({
    elementRef: ref,
    elementKey: scrollKey
  })
  const tabPanes = Object.entries(dashboard.topicToChannels).map(i => (
    <TabPane tab={t(trans.Feed[i[0]])} className={'pt-6 grow flex flex-col'} key={`${i[0]}`}>
      <YoutubeDashboardPane scrollElementRef={ref} scrollKey={scrollKey} items={i[1].items} />
    </TabPane>
  ))
  if (followedPlaylists?.length) {
    tabPanes.unshift(
      <TabPane tab={t(trans.Feed.MyPlaylists)} className={'pt-6 grow flex flex-col'} key={'my playlists'}>
        <YoutubeDashboardPane.ItemPane scrollKey={scrollKey} scrollElementRef={ref} items={followedPlaylists} type={'playlist'} />
      </TabPane>
    )
  }
  if (followedChannels?.length) {
    tabPanes.unshift(
      <TabPane tab={t(trans.Feed.MyChannels)} className={'pt-6 grow flex flex-col'} key={'my channels'}>
        <YoutubeDashboardPane.ItemPane scrollKey={scrollKey} scrollElementRef={ref} items={followedChannels} type={'channel'} />
      </TabPane>
    )
  }

  return (
    <div className={'h-full w-full overflow-y-auto px-6 pt-0'} ref={ref}>
      <div className={'mx-auto min-h-full py-6 flex flex-col'}>
        <div className={'pb-4'}>
          <FeedSearchInput
            value={state.search?.query ?? ''}
            onChange={v => {
              setState(s => ({ ...s, search: { ...s.search, query: v } }))
            }}
            onSubmit={() => {
              navigate('/youtube/search')
              setState(s => ({ ...s, search: { ...s.search, token: undefined, isLoadingMore: false, hasMore: false, results: undefined } }))
              setTimeout(() => {
                instance.youtubeOps?.search()
              })
            }}
          />
        </div>
        <div className={'flex gap-3'}>
          <div
            className={'border-round-icon-button'}
            onClick={() => {
              navigate('/youtube/library')
            }}
          >
            <Icon name={Icons.DocumentLibrary} />
            {t(trans.Feed.Library)}
          </div>
          <div
            className={'border-round-icon-button'}
            onClick={() => {
              navigate('/youtube/history')
            }}
          >
            <Icon name={Icons.History} />
            {t(trans.History)}
          </div>
        </div>
        <Tabs
          tabNavContainerClassname={
            '!sticky top-0 no-scrollbar !gap-2 w-full shrink-0 overflow-x-auto bg-global capitalize font-medium !justify-normal z-10 border-bottom mt-4'
          }
          container={false}
          tabNavMode={'underline'}
          tabNavClassname={'shrink-0 !pb-1.5 !px-3 !pt-2'}
          tabNavLeftClassName={classnames(
            '!shrink-0 !flex-nowrap mx-auto',
            !(dashboard.activeTopic === 'my playlists' || dashboard.activeTopic === 'my channels') && 'pl-10'
          )}
          activeKey={dashboard.activeTopic}
          extra={
            dashboard.activeTopic === 'my playlists' || dashboard.activeTopic === 'my channels' ? null : (
              <Icon
                onClick={() => {
                  useYoutubeData.updateData(s => ({
                    ...s,
                    dashboard: {
                      ...s.dashboard,
                      topicToChannels: {
                        ...s.dashboard.topicToChannels,
                        [s.dashboard.activeTopic]: {
                          key: s.dashboard.activeTopic,
                          items: []
                        }
                      }
                    }
                  }))
                  useYoutubeData.fetchDashboardTopicChannels(dashboard.activeTopic)
                }}
                name={'park-refresh'}
                className={'square-button w-8 h-8'}
              />
            )
          }
          onTabClick={k =>
            useYoutubeData.updateData(curr => ({
              ...curr,
              dashboard: {
                ...curr.dashboard,
                activeTopic: k
              }
            }))
          }
        >
          {tabPanes}
        </Tabs>
      </div>
    </div>
  )
})
