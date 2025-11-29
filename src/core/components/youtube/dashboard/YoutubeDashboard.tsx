import { memo, useEffect, useLayoutEffect, useRef } from 'react'
import useYoutubeData from '@/core/components/youtube/hooks/useYoutubeData'
import { Icon, TabPane, Tabs } from '@/components'
import { ObjectStore } from '@/api/stores'
import { useUpdate } from 'react-use'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import YoutubeDashboardPane from '@/core/components/youtube/dashboard/YoutubeDashboardPane'

export default memo(() => {
  const data = useYoutubeData()
  const { dashboard } = data
  const update = useUpdate()
  useLayoutEffect(() => {
    update()
  }, [])
  useEffect(() => {
    ObjectStore('youtubeFolder').getAll()
  }, [])
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.scrollTo(0, 0)
    if (!dashboard.topicToVideos?.[dashboard.activeTopic]?.items?.length) {
      useYoutubeData.fetchDashboardTopicVideos(dashboard.activeTopic)
    }
  }, [dashboard.activeTopic])
  const { t } = useTranslation()
  const tabPanes = Object.entries(dashboard.topicToChannels).map(i => <TabPane tab={t(trans.Feed[i[0]])} key={`${i[0]}`}></TabPane>)
  const renderInner = () => {
    const topic = dashboard.activeTopic
    return <YoutubeDashboardPane scrollElementRef={ref} topic={topic} />
  }
  return (
    <div className={'h-full flex w-full flex-col'}>
      <Tabs
        tabNavContainerClassname={'no-scrollbar py-4 !gap-2 w-full shrink-0 overflow-x-auto capitalize font-medium z-10 px-7'}
        container={false}
        tabNavClassname={'shrink-0 !pl-0 !pr-5 font-size-14'}
        tabNavLeftClassName={'!shrink-0 !flex-nowrap'}
        activeKey={dashboard.activeTopic}
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
      <div className={'w-full flex flex-col flex-1 overflow-y-auto p-7 pt-0'} ref={ref}>
        {renderInner()}
      </div>
    </div>
  )
})
