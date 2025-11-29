import useYoutubeData from '@/core/components/feed/youtube/useYoutubeData'
import { useParams } from 'react-router-dom'
import useFilterVideos from '@/core/components/feed/youtube/useFilterVideos'
import YoutubeSearchResultRenderer from '@/core/components/feed/youtube/YoutubeSearchResultRenderer'
import { ObjectStore } from '@/api/stores'
import { memo, RefObject, useLayoutEffect, useMemo, useRef, useState } from 'react'
import useYoutubeState from '@/core/components/feed/youtube/useYoutubeState'
import VirtualLoader from '@/core/components/feed/youtube/components/VirtualLoader'
import { Button, useElementScrollRestore } from '@/components'
import { useUpdate } from 'react-use'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { DateFormat } from '@/utils'
import classnames from 'classnames'
import { Icons } from '@/consts'

export default memo(() => {
  const { id, type } = useParams()
  const history = useYoutubeData().history
  const [yState, setYState] = useYoutubeState()
  const [name, setName] = useState<string>()
  const memoHistory = yState.dataCache.history
  useLayoutEffect(() => {
    if (type && id) {
      if (type === 'channel') {
        ObjectStore('youtubeChannel')
          .fetchOneById(Number(id))
          .then(i => {
            setName(i?.name)
          })
      }
      if (type === 'playlist') {
        ObjectStore('youtubePlaylist')
          .fetchOneById(Number(id))
          .then(i => {
            setName(i?.name)
          })
      }
    } else {
      setName(undefined)
    }
    if ((!type && !id) || !history) {
      setYState(s => ({ ...s, dataCache: { ...s.dataCache, history: history?.map(i => i.id) ?? [] } }))
      return
    }
    Promise.all(history.map(async i => await ObjectStore('youtubeVideo').fetchOneById(i.id))).then(videos => {
      switch (type) {
        case 'playlist': {
          const playlistAppId = Number(id)
          videos = videos.filter(i => i?.playlistAppId === playlistAppId)
          break
        }
        case 'channel': {
          const channelAppId = Number(id)
          videos = videos.filter(i => i?.channelAppId === channelAppId)
          break
        }
      }
      setYState(s => ({ ...s, dataCache: { ...s.dataCache, history: videos.map(i => i.id) } }))
    })
  }, [id, type, history])
  const ref = useRef<HTMLDivElement>(null)
  const { renderFilter, renderSearch, finalResults, renderGrouperChooser } = useFilterVideos(memoHistory, 'youtube_history')
  const update = useUpdate()
  const clearHistory = () => {
    const currentHistorySet = new Set(finalResults)
    useYoutubeData.updateData(c => ({ ...c, history: c.history?.filter(i => !currentHistorySet.has(i.id)) }))
  }
  useLayoutEffect(() => {
    update()
  }, [])
  useElementScrollRestore({
    elementRef: ref,
    elementKey: 'youtube_history'
  })
  const categorizedHistory = useMemo(() => {
    if (!history) return []
    const final = finalResults
    const idToDate = new Map(history.map(i => [i.id, i.date]))
    const historyWithDate = final
      .map(i => ({
        id: i,
        date: idToDate.get(i)
      }))
      .filter(i => i.date) as { id: number; date: number }[]
    const groupByDate = historyWithDate.reduce(
      (acc, obj) => {
        // 将日期字符串转换为Date对象
        const date = new Date(obj.date)
        // 只保留年月日，去除时间部分
        const timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
        // 如果acc对象中没有该timestamp作为key，初始化为一个空数组
        if (!acc[timestamp]) {
          acc[timestamp] = []
        }
        // 将对象添加到对应日期的数组中
        acc[timestamp].push(obj.id)
        return acc
      },
      {} as Record<number, number[]>
    )
    return Object.entries(groupByDate)
      .map(i => ({
        date: i[0],
        items: i[1]
      }))
      .sort((a, b) => Number(b.date) - Number(a.date))
  }, [finalResults])
  const { t } = useTranslation()
  return (
    <div className={'w-full h-full overflow-y-auto px-6'} ref={ref}>
      <div className={'w-full min-h-full flex pt-4 pb-6 flex-col max-w-7xl mx-auto'}>
        <div className={'flex justify-between items-start pl-2 mb-8 flex-wrap'}>
          <div>
            <div className={'text-3xl font-bold'}>{t(trans.History)}</div>
            {name && <div className={'transparent-font mt-1'}>{name}</div>}
          </div>
          {memoHistory.length ? (
            <div className={'flex gap-3 shrink-0'}>
              {renderSearch()}
              {renderFilter()}
              {renderGrouperChooser()}
              <Button.IconButton
                icon={Icons.Delete}
                onClick={() => {
                  clearHistory()
                }}
                className={'!rounded-full delete-button !px-4 !py-1 !h-auto button border'}
                text={t(trans.Clear)}
              ></Button.IconButton>
            </div>
          ) : null}
        </div>
        <HistoryTable scrollElementRef={ref} items={categorizedHistory} />
      </div>
    </div>
  )
})

const HistoryTable = ({
  items,
  scrollElementRef
}: {
  items: { date: string; items: number[] }[]
  scrollElementRef: RefObject<HTMLDivElement>
}) => {
  const { t } = useTranslation()
  const instance = useFeedInstance()
  if (!items.length) {
    return (
      <div className={'w-full flex items-center justify-center grow'}>
        <div className={'transparent-font font-semibold'}>{t(trans.NoResult)}</div>
      </div>
    )
  }
  return (
    <VirtualLoader
      size={140}
      overscan={0}
      count={items.length}
      className={'pb-40'}
      renderItem={idx => {
        const i = items[idx]
        if (i) {
          return (
            <>
              <div className={classnames('pl-2 text-2xl mb-2 font-bold border-bottom pb-3', idx !== 0 && 'mt-6')}>
                {DateFormat.formatDate(Number(i.date))}
                {` (${i.items.length})`}
              </div>
              {i.items.map(o => (
                <VideoItem
                  onNavigate={() => {
                    instance.youtubeOps?.goTo(o, 'video', {
                      history: true
                    })
                  }}
                  key={o}
                  id={o}
                />
              ))}
            </>
          )
        }
        return null
      }}
      scrollElementRef={scrollElementRef}
      scrollKey={'youtube_history'}
    />
  )
}

const VideoItem = ({ id, onNavigate }: { id: number; onNavigate: VoidFunction }) => {
  const video = ObjectStore('youtubeVideo').useValue(id)
  if (!video) return null
  return <YoutubeSearchResultRenderer.VideoRenderer onClick={onNavigate} id={id} />
}
