import useYoutubeData from '@/core/components/youtube/hooks/useYoutubeData'
import useFilterVideos from '@/core/components/youtube/hooks/useFilterVideos'
import { ObjectStore } from '@/api/stores'
import { memo, RefObject, useLayoutEffect, useMemo, useState } from 'react'
import useYoutubeState from '@/core/components/youtube/hooks/useYoutubeState'
import VirtualLoader from '@/core/components/common/VirtualLoader'
import { BetterInput, Button, Icon } from '@/components'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { DateFormat } from '@/utils'
import classnames from 'classnames'
import { Icons } from '@/consts'
import useYoutubeInstance from '@/core/components/youtube/hooks/useYoutubeInstance'
import YoutubeVideoCard from '@/core/components/youtube/components/YoutubeVideoCard'
import { IYoutubeData } from '@/api/stores/keyvalue.store'
import { IYoutubeChannel, IYoutubePlaylist } from '~/typings'
import YoutubeConsts from '@/core/components/youtube/YoutubeConsts'
import { EmptyList } from '../../common'

export default memo(() => {
  const history = useYoutubeData().history
  const [yState, setYState] = useYoutubeState()
  const memoHistory = yState.dataCache.history
  const instance = useYoutubeInstance()
  const key = YoutubeConsts.Search.History
  useLayoutEffect(() => {
    if (!history) {
      setYState(s => ({ ...s, dataCache: { ...s.dataCache, history: [] } }))
      return
    }
    ObjectStore('youtubeVideo')
      .getMultipleByIds(history.map(i => i.id))
      .then(videos => {
        if (yState.history?.channel) {
          videos = videos.filter(i => i.channelAppId === yState.history?.channel)
        }
        if (yState.history?.playlist) {
          videos = videos.filter(i => i.playlistAppId === yState.history?.playlist)
        }
        setYState(s => ({ ...s, dataCache: { ...s.dataCache, history: videos.map(i => i.id) } }))
      })
  }, [yState.history, history])
  const { finalResults, setState, state } = useFilterVideos(memoHistory, key)

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
    <div className={'min-h-full flex flex-col w-full p-10'}>
      <div className='items-start flex justify-between'>
        <div className={'text-3xl font-bold mb-9'}>{t(trans.History)}</div>
        <Button.IconButton
          text={t(trans.Clear)}
          icon={Icons.Delete}
          onClick={() => useYoutubeData.updateData(s => ({ ...s, history: [] }))}
          className='!px-3 !rounded-3xl cursor-pointer font-medium has-bg-button'
        ></Button.IconButton>
      </div>
      <HistoryTable scrollElementRef={instance.scrollElementRef} items={categorizedHistory} />
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
  const instance = useYoutubeInstance()
  ObjectStore('youtubeVideo').useMultiple(useMemo(() => items.map(i => i.items).flat(), [items]))
  if (!items.length) {
    return <EmptyList />
  }
  return (
    <VirtualLoader
      size={140}
      overscan={1}
      count={items.length}
      className={'pb-40 flex-1'}
      renderItem={idx => {
        const i = items[idx]
        if (i) {
          return (
            <>
              <div className={classnames('text-2xl mb-6 font-bold', idx !== 0 && 'mt-8')}>{DateFormat.formatDate(Number(i.date))}</div>
              <div
                className={'grid gap-6'}
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))'
                }}
              >
                {i.items.map(o => {
                  const v = ObjectStore('youtubeVideo').getCachedOneById(o)
                  if (v) {
                    return (
                      <YoutubeVideoCard
                        onClick={() => {
                          instance.goTo?.(o, 'video', {
                            history: true
                          })
                        }}
                        key={o}
                        channelId={v.channelId}
                        channel={v.channelTitle}
                        duration={v.duration}
                        title={v.name}
                        image={v.thumbnail}
                      />
                    )
                  }
                })}
              </div>
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

const HistorySidebar = ({
  history,
  onSearchChange,
  search
}: {
  history: IYoutubeData['history']
  search?: string
  onSearchChange: (s: string) => void
}) => {
  const { t } = useTranslation()
  const [state, setState] = useState<{
    channels: Record<
      number,
      {
        channel: IYoutubeChannel
        count: number
      }
    >
    playlists: Record<
      number,
      {
        playlist: IYoutubePlaylist
        count: number
      }
    >
    date: {
      time: number
      count: number
    }[]
  }>({
    channels: {},
    playlists: {},
    date: []
  })
  useLayoutEffect(() => {
    const action = async () => {
      const ids = history?.map(i => i.id)
      if (ids?.length) {
        const videos = await ObjectStore('youtubeVideo').getMultipleByIds(ids)
        const res: typeof state = {
          channels: {},
          playlists: {},
          date: []
        }
        await Promise.allSettled(
          videos.map(async i => {
            if (i.channelAppId) {
              const channel = await ObjectStore('youtubeChannel').getOneById(i.channelAppId)
              if (channel) {
                res.channels[channel.id] = {
                  channel,
                  count: (res.channels[channel.id]?.count ?? 0) + 1
                }
              }
            }
            if (i.playlistAppId) {
              const playlist = await ObjectStore('youtubePlaylist').getOneById(i.playlistAppId)
              if (playlist) {
                res.playlists[playlist.id] = {
                  playlist,
                  count: (res.playlists[playlist.id]?.count ?? 0) + 1
                }
              }
            }
          })
        )
        console.log(res)
        setState(res)
      }
    }
    action()
  }, [history])
  const [ytState, setYtState] = useYoutubeState()
  const sortedChannels = Object.values(state.channels).toSorted((b, a) => a.count - b.count)
  const sortedPlaylists = Object.values(state.playlists).toSorted((b, a) => a.count - b.count)
  return (
    <div
      className={'flex flex-col gap-3 mt-3'}
      style={{
        width: 280
      }}
    >
      <div className={'flex items-center pb-2 transition-colors focus-within-primary-border px-2 border-bottom gap-3'}>
        <Icon size={16} name={Icons.Search} />
        <BetterInput
          value={search}
          onChange={e => onSearchChange?.(e.target.value)}
          className={'font-size-13'}
          placeholder={t(trans.Search)}
        />
      </div>
      <Button.IconButton
        icon={Icons.Delete}
        onClick={() => {
          useYoutubeData.updateData(c => ({ ...c, history: [] }))
        }}
        text={t(trans.Feed.ClearHistory)}
      />
      {sortedChannels.length ? (
        <div>
          <div className={'menu-sub-title ml-2 mb-1'}>{t(trans.Feed.Channels)}</div>
          {sortedChannels.map(i => (
            <Button.IconButton
              onClick={() => {
                setYtState(s => ({
                  ...s,
                  history: {
                    channel: s.history?.channel === i.channel.id ? undefined : i.channel.id,
                    playlist: undefined
                  }
                }))
              }}
              className={ytState.history?.channel === i.channel.id ? 'active-button' : ''}
              suffixStr={i.count}
              image={i.channel.thumbnail}
              key={i.channel.id}
              text={i.channel.name}
            />
          ))}
        </div>
      ) : null}
      {sortedPlaylists.length ? (
        <div>
          <div className={'menu-sub-title ml-2 mb-1'}>{t(trans.Feed.Playlists)}</div>
          {sortedPlaylists.map(i => (
            <Button.IconButton
              onClick={() => {
                setYtState(s => ({
                  ...s,
                  history: {
                    channel: undefined,
                    playlist: s.history?.playlist === i.playlist.id ? undefined : i.playlist.id
                  }
                }))
              }}
              suffixStr={i.count}
              image={i.playlist.thumbnail}
              key={i.playlist.id}
              className={ytState.history?.playlist === i.playlist.id ? 'active-button' : ''}
              text={i.playlist.name}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
