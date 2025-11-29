import VirtualLoader from '@/core/components/common/VirtualLoader'
import useReviewState from '@/core/components/review/useReviewState'
import RecentlyCards, { ReviewHistoryItem } from '@/core/components/review/home/RecentlyCards'
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useUpdate } from 'react-use'
import { IReviewCard } from '~/typings'
import { startOfDay } from 'date-fns'
import { DateFormat } from '@/utils'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { Icon } from '@/components'
import ReviewRateTag from '@/core/components/review/ReviewRateTag'
import NoResult from '@/core/components/common/NoResult'
import classnames from 'classnames'

type IHistory = {
  items: { card: IReviewCard; metaId: number }[]
  rates: {
    again: number
    good: number
    easy: number
    hard: number
  }
  time: number
}

const getTime = (d?: Date | number) => {
  if (!d) return 0
  if (typeof d === 'number') return d
  return d.getTime()
}

export default memo(() => {
  const ref = useRef<HTMLDivElement>(null)
  const history = useReviewState().recently
  const update = useUpdate()
  const data = useMemo(() => {
    const dateToHistory: Record<string, IHistory> = {}
    history.forEach(c => {
      const lastReview = c.card.last_review as number | Date | undefined
      if (!lastReview) return
      const reviewTime = getTime(lastReview)
      const start = startOfDay(reviewTime).getTime()
      const res = dateToHistory[start] || {
        items: [],
        rates: {
          again: 0,
          good: 0,
          easy: 0,
          hard: 0
        },
        time: Number(start)
      }
      res.items.push(c)
      if (c.card.last_rate) {
        res.rates[c.card.last_rate] += 1
      }
      dateToHistory[start] = res
      res.items.sort((a, b) => getTime(a.card.last_review) - getTime(b.card.last_review))
    })
    return Object.values(dateToHistory)
  }, [history])
  const stats = useMemo(() => {
    const res = {
      total: 0,
      date: 0,
      rates: {
        good: 0,
        easy: 0,
        hard: 0,
        again: 0
      }
    }
    data.forEach(i => {
      res.date += 1
      Object.entries(i.rates).forEach(r => {
        res['rates'][r[0]] += r[1]
      })
      res.total += i.items.length
    })
    return res
  }, [data])
  useLayoutEffect(() => {
    update()
  }, [])
  const { t } = useTranslation()
  return (
    <div className={'w-full h-full overflow-y-auto p-6 pt-9'} ref={ref}>
      <div className={'pb-10 min-h-full flex flex-col container-5xl'}>
        <div className={'flex justify-between gap-x-8 gap-y-4 mb-8'}>
          <div className={'font-bold text-4xl'}>{t(trans.History)}</div>
          <div className={'flex items-center gap-12'}>
            <div>
              <div className={'transparent-font font-size-13'}>{t('review.Cards studied')}</div>
              <div className={'font-semibold text-xl'}>{stats.total}</div>
            </div>
            <div>
              <div className={'transparent-font font-size-13'}>{t('review.Active days')}</div>
              <div className={'font-semibold text-xl'}>{stats.date}</div>
            </div>
          </div>
        </div>
        {data.length ? (
          data.map((i, idx) => <Item haveNext={idx !== data.length - 1} item={i} key={i.time} />)
        ) : (
          <div className={'flex-1 flex flex-col'}>
            <NoResult />
          </div>
        )}
      </div>
    </div>
  )
})

const Item = ({ item, haveNext }: { item: IHistory; haveNext?: boolean }) => {
  const { t } = useTranslation()
  const [viewMore, setViewMore] = useState(false)
  const max = 10
  return (
    <div>
      <div className={'flex gap-6'}>
        <div className={'flex flex-col items-center'}>
          <Icon
            theme={'filled'}
            size={16}
            name={'park-flag'}
            className={'p-2 rounded-full bg-secondary text-violet-500 dark:text-violet-700'}
          ></Icon>
          <div className={'w-[1px] bg-secondary h-full'}></div>
        </div>
        <div className={classnames('w-full', haveNext ? 'pb-10' : undefined)}>
          <div className={'flex items-end mb-4 gap-3'}>
            <div className={'font-semibold text-2xl'}>{DateFormat.formatDate(item.time)}</div>
            <div className={'flex gap-3 items-center'}>
              <div className={'font-semibold text-lg'}> {t('review.cards studied', { num: item.items.length })}</div>
              {Object.entries(item.rates)
                .filter(i => i[1])
                .map(i => (
                  <ReviewRateTag count={i[1]} rate={i[0]} key={i[0]} />
                ))}
            </div>
          </div>
          <div className={'bg-secondary p-3 rounded-xl'}>
            <div className={'flex gap-5 w-full font-size-13 transparent-font pl-2'}>
              <div
                style={{
                  width: 100
                }}
              >
                {t('review.Date')}
              </div>
              <div
                style={{
                  width: 120
                }}
              >
                {t('review.Rating')}
              </div>
              <div
                style={{
                  width: 120
                }}
              >
                {t('general.type')}
              </div>
              <div
                style={{
                  flex: 1
                }}
              >
                {t(trans.Name)}
              </div>
            </div>
            {item.items.slice(0, viewMore ? item.items.length : max).map(i => (
              <ReviewHistoryItem thirdTag showDate={false} card={i.card} metaId={i.metaId} />
            ))}
            {item.items.length > max && !viewMore && (
              <div
                className={'cursor-pointer transparent-font px-2 py-1 ml-auto w-fit flex group gap-2'}
                onClick={() => {
                  setViewMore(true)
                }}
              >
                {t('review.View more')}
                <Icon size={16} strokeWidth={4} name={'park-down'} className={'group-hover:translate-y-1 transition-transform'} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
