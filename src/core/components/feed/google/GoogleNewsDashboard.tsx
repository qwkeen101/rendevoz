import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import useGoogleNews from '@/core/components/feed/google/useGoogleNewsState'
import { TabPane, Tabs, useElementScrollRestore } from '@/components'
import googleNewsTopicToId from './googleNewsTopicToId.json'
import GoogleNewsItemRenderer from '@/core/components/feed/google/GoogleNewsItemRenderer'
import { IGoogleNews } from '@/core/components/feed/types'
import { useMeasure, useNorepeatNavigate } from '@/hooks'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import GoogleNewsSearchInput from '@/core/components/feed/components/FeedSearchInput'
import classnames from 'classnames'
import useAssignGoogleNews from '@/core/components/feed/google/useAssignGoogleNews'
export default memo(() => {
  useAssignGoogleNews()
  const [googleNewsState, setGoogleNewsState] = useGoogleNews()
  useLayoutEffect(() => {
    useGoogleNews.fetchGoogleNewsByTopicId(googleNewsState.activeTopic)
  }, [googleNewsState.activeTopic])
  const ref = useRef<HTMLDivElement>(null)
  useElementScrollRestore({
    elementKey: `feed_google_news`,
    elementRef: ref
  })
  const navigate = useNorepeatNavigate()
  const rootFontSize = parseInt(getComputedStyle(document.documentElement).fontSize)
  return (
    <div ref={ref} className={'flex flex-col overflow-y-auto h-full'}>
      <div className={'px-6 pt-6 pb-2'}>
        <GoogleNewsSearchInput
          value={googleNewsState.search ?? ''}
          onSubmit={() => {
            useGoogleNews.fetchGoogleNewsSearchResults()
            navigate('/google/search')
          }}
          onChange={v => {
            setGoogleNewsState(s => ({ ...s, search: v }))
          }}
        />
      </div>
      <Tabs
        tabNavContainerClassname={'!sticky bg-global !justify-center z-10 top-0 px-6 pt-2'}
        container={false}
        tabNavClassname={'shrink-0'}
        tabNavLeftClassName={'no-scrollbar !flex-nowrap'}
        onTabClick={k => setGoogleNewsState(s => ({ ...s, activeTopic: k }))}
        tabNavMode={'underline'}
        activeKey={googleNewsState.activeTopic}
      >
        {Object.keys(googleNewsTopicToId).map(i => (
          <TabPane tab={i} key={i}>
            <TopicPane rem={rootFontSize} topic={i} items={googleNewsState.topicToNews[i] || []} />
          </TabPane>
        ))}
      </Tabs>
    </div>
  )
})

const TopicPane = ({ items, topic, rem }: { items: IGoogleNews[]; topic: string; rem: number }) => {
  const navigate = useNorepeatNavigate()
  const instance = useFeedInstance()
  const groupedItems = useMemo(
    () =>
      items.reduce((acc, item) => {
        if (item.image) {
          // 如果有 image 属性，创建一个新的分组
          acc.push([item])
        } else {
          if (acc.length === 0) {
            acc.push([item])
          }
          // 否则将其添加到上一个分组中
          if (acc[acc.length - 1][0].image) {
            // 如果当前没有分组或最后一个分组的第一个元素有 image 属性，创建一个新的分组
            acc[acc.length - 1].push(item)
          }
        }
        return acc
      }, [] as IGoogleNews[][]),
    [items]
  )
  const ref = useRef<HTMLElement>()
  const { width } = useMeasure(ref)
  const handleNavigate = async (o: IGoogleNews) => {
    const feed = await instance.googleOps?.addGoogleNewsAsFeed(o)
    if (feed) {
      navigate(`/feed/${feed.id}`)
    }
  }
  const colMode = width < rem * 48
  return (
    <div className={'w-full'}>
      <div ref={ref} className={'p-6 mx-auto w-full @container max-w-6xl flex gap-6 flex-col'}>
        {groupedItems.map(i => {
          const colsItems = i.filter(o => !o.image).slice(0, 3)
          return (
            <div
              className={classnames(
                'flex flex-col @3xl:flex-row pb-6 [&:not(:last-child)]:!border-b !border-b-0 border-bottom',
                colMode ? 'gap-6' : 'gap-10'
              )}
            >
              {i[0].image && (
                <GoogleNewsItemRenderer
                  onNavigate={handleNavigate}
                  item={i[0]}
                  column={i.length > 1 && !colMode}
                  large={i.length === 1 || colMode}
                />
              )}
              {colsItems.length ? (
                <div className={'flex flex-col gap-3'}>
                  {colsItems.map((o, idx, arr) => (
                    <GoogleNewsItemRenderer
                      large={arr.length === 1}
                      onNavigate={handleNavigate}
                      item={o}
                      key={o.title}
                      className={'pb-3'}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
