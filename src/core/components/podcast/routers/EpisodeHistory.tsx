import { memo, useMemo, useRef } from 'react'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import VirtualLoader from '@/core/components/common/VirtualLoader'
import ItemRenderer from '@/core/components/podcast/ItemRenderer'
import classnames from 'classnames'
import { DateFormat } from '@/utils'
import { useMeasure, useNorepeatNavigate } from '@/hooks'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components'
import { Icons } from '@/consts'
import useEpisodeFilter from '@/core/components/podcast/hooks/useEpisodeFilter'
import NoResult from '@/core/components/common/NoResult'
import { useLocation } from 'react-router-dom'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'

export default memo(() => {
  const history = usePodcastData().history
  const instance = usePodcastInstance()
  const sk = useLocation().pathname
  const memoHistory = useMemo(() => history ?? [], [history])
  const memoHistoryIds = useMemo(() => memoHistory.map(i => i.id), [memoHistory])
  const { finalResults } = useEpisodeFilter(memoHistoryIds, sk, {
    isObject: true,
    hasHighlight: true
  })
  const grouped = useMemo(() => {
    const idSet = new Set(finalResults)
    const historyWithDate = memoHistory.filter(i => idSet.has(i.id))
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
    return Object.entries(groupByDate)
      .map(i => ({
        date: i[0],
        items: i[1]
      }))
      .sort((a, b) => Number(b.date) - Number(a.date))
  }, [finalResults])
  const scrollElementRef = instance.scrollElementRef
  const { width } = useMeasure(scrollElementRef)
  const colMode = width > 0 && width < 600
  const navigate = useNorepeatNavigate()
  const { t } = useTranslation()
  return (
    <div className={'@container w-full min-h-full flex flex-col p-8'}>
      <div className={'flex justify-between items-start mb-8'}>
        <div className={'text-3xl font-bold'}>{t(trans.History)}</div>
        {memoHistoryIds.length ? (
          <div className={'flex gap-3'}>
            <Button.IconButton
              onClick={() => {
                usePodcastData.updateData(c => ({ ...c, history: [] }))
              }}
              text={t(trans.Clear)}
              icon={Icons.Delete}
              className={'transparent-font !rounded-2xl !px-3'}
            ></Button.IconButton>
          </div>
        ) : null}
      </div>
      {grouped?.length ? (
        <VirtualLoader
          scrollKey={sk}
          size={50}
          className={'pb-40'}
          itemClassName={'pb-4'}
          scrollElementRef={scrollElementRef}
          count={Object.keys(grouped).length}
          renderItem={idx => {
            const item = grouped[idx]
            if (item) {
              return (
                <>
                  <div className={classnames('text-2xl pb-4 font-bold', idx !== 0 && 'mt-6')}>
                    {DateFormat.formatDate(Number(item.date))}
                  </div>
                  {item.items.map(i => (
                    <ItemRenderer
                      className={'mb-4'}
                      columnMode={colMode}
                      id={i.id}
                      onClick={() => {
                        navigate(`/episode/${i.id}`)
                      }}
                      type={'episode'}
                      key={i.id}
                    />
                  ))}
                </>
              )
            }
            return null
          }}
        ></VirtualLoader>
      ) : (
        <NoResult />
      )}
    </div>
  )
})
