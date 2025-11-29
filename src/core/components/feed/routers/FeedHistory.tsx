import useFeedData from '@/core/components/feed/hooks/useFeedData'
import { useLayoutEffect, useMemo } from 'react'
import { useUpdate } from 'react-use'
import { Button } from '@/components'
import { Icons } from '@/consts'
import { useParams } from 'react-router-dom'
import { ObjectStore } from '@/api/stores'
import useFeedFilter from '@/core/components/feed/hooks/useFeedFilter'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import VirtualLoader from '@/core/components/common/VirtualLoader'
import MagazineFeedItem from '@/core/components/feed/components/items/MagazineFeedItem'
import { DateFormat } from '@/utils'
import classnames from 'classnames'
import NoResult from '@/core/components/common/NoResult'
import { EmptyList } from '../../common'
import TitleFeedItem from '../components/items/TitleFeedItem'

export default () => {
  const { collectionId, folderId } = useParams()
  const data = useFeedData()
  const history = data.history
  const key = '/feed/history'
  const update = useUpdate()

  const collection = ObjectStore('feedCollection').useValue(collectionId ? Number(collectionId) : undefined)
  const folder = ObjectStore('feedFolder').useValue(folderId ? Number(folderId) : undefined)
  const memoedHistory = useMemo(() => {
    const historyIdSet = new Set(history.map(i => i.id))
    let res: number[] = []
    if (collection) {
      res = collection.items.filter(i => historyIdSet.has(i))
    } else if (folder?.feeds) {
      res = folder.feeds.filter(i => historyIdSet.has(i))
    } else {
      res = Array.from(historyIdSet.values())
    }
    return res
  }, [collection?.items, folder?.feeds, data.history])

  const feeds = ObjectStore('feed').useMultiple(memoedHistory)
  const { setState, finalResults } = useFeedFilter(memoedHistory, key, {
    isObject: true,
    hasHighlight: true,
    read: false,
    unread: false
  })
  useLayoutEffect(() => {
    update()
  }, [])
  const instance = useFeedInstance()
  const clearHistory = () => {
    if (collection) {
      const collectionIdSet = new Set(collection.items)
      useFeedData.updateData(curr => ({ ...curr, history: curr.history.filter(i => !collectionIdSet.has(i.id)) }))
      setState(s => ({ ...s, searchResult: undefined, query: undefined, visible: false }))
    } else if (folder) {
      const folderFeedIdSet = new Set(folder.feeds ?? [])
      useFeedData.updateData(curr => ({ ...curr, history: curr.history.filter(i => !folderFeedIdSet.has(i.id)) }))
      setState(s => ({ ...s, searchResult: undefined, query: undefined, visible: false }))
    } else {
      useFeedData.updateData(curr => ({ ...curr, history: [] }))
    }
  }
  const finalHistory = finalResults
  const categorizedHistory = useMemo(() => {
    const existedFeedIds = new Set(feeds.map(i => i.id))
    const idToDate = new Map(history.filter(i => existedFeedIds.has(i.id)).map(i => [i.id, i.date]))
    const historyWithDate = finalHistory
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
        acc[timestamp].push(obj)
        return acc
      },
      {} as Record<number, (typeof historyWithDate)[0][]>
    )
    console.log(groupByDate, history)
    return Object.entries(groupByDate)
      .map(i => ({
        date: i[0],
        items: i[1]
      }))
      .sort((a, b) => Number(b.date) - Number(a.date))
  }, [finalHistory])
  const { t } = useTranslation()

  return (
    <div className={'w-full min-h-full p-8 flex flex-col @container'}>
      <div className={'mb-8 flex justify-between items-start'}>
        <div>
          <div className={'text-3xl font-bold'}>{t(trans.History)}</div>
          {collection && <div className={'transparent-font mt-2'}>{collection.name}</div>}
        </div>
        {memoedHistory.length ? (
          <Button.IconButton
            icon={Icons.Delete}
            onClick={() => {
              clearHistory()
            }}
            className={'!px-3 !rounded-3xl'}
            text={t(trans.Clear)}
          ></Button.IconButton>
        ) : null}
      </div>
      {!finalHistory?.length ? (
        <EmptyList />
      ) : (
        <VirtualLoader
          scrollElementRef={instance.scrollElementRef}
          scrollKey={key}
          renderItem={idx => {
            const item = categorizedHistory[idx]
            if (item) {
              return (
                <>
                  <div className={classnames('text-xl pb-3 font-bold', idx !== 0 && 'mt-6')}>
                    {DateFormat.formatDate(Number(item.date))}
                  </div>
                  {item.items.map(i => (
                    <TitleFeedItem
                      id={i.id}
                      key={i.id}
                      onClick={() => {
                        instance.feedOps?.read(i.id)
                      }}
                    />
                  ))}
                </>
              )
            }
            return null
          }}
          className={'pb-40'}
          count={categorizedHistory.length}
        ></VirtualLoader>
      )}
    </div>
  )
}
