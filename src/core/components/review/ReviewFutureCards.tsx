import { useTranslation } from 'react-i18next'
import useReviewState from '@/core/components/review/useReviewState'
import NoResult from '@/core/components/common/NoResult'
import trans from '@/consts/trans'
import { ReviewHistoryItem } from '@/core/components/review/home/RecentlyCards'
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components'
import { DateFormat } from '@/utils'
import { useUpdate } from 'react-use'
import { IReviewCard } from '~/typings'
import classnames from 'classnames'
const getTime = (d: Date | number) => {
  if (typeof d === 'number') return d
  return d.getTime()
}
export default memo(() => {
  const ref = useRef<HTMLDivElement>(null)
  const state = useReviewState()
  const update = useUpdate()
  const { data, days, total } = useMemo(() => {
    const entries = Object.entries(state.futureDue)
    entries.forEach(i => {
      i[1].sort((a, b) => getTime(a.due!) - getTime(b.due!))
    })
    entries.sort((b, a) => Number(b[0]) - Number(a[0]))
    const total = Object.values(state.futureDue).flat().length
    const days = Object.keys(state.futureDue).length
    return {
      days,
      total,
      data: entries
    }
  }, [state.futureDue])
  useLayoutEffect(() => {
    update()
  }, [])
  const { t } = useTranslation()
  return (
    <div className={'w-full h-full overflow-y-auto p-6 pt-9'} ref={ref}>
      <div className={'pb-10 min-h-full flex flex-col container-5xl'}>
        <div className={'flex justify-between gap-x-8 gap-y-4 mb-8'}>
          <div className={'font-bold text-4xl'}>{t('review.Future cards')}</div>
          <div className={'flex items-center gap-12'}>
            <div>
              <div className={'transparent-font font-size-13'}>{t('review.Future cards to study')}</div>
              <div className={'font-semibold text-xl'}>{total}</div>
            </div>
            <div>
              <div className={'transparent-font font-size-13'}>{t('review.Total days')}</div>
              <div className={'font-semibold text-xl'}>{days}</div>
            </div>
          </div>
        </div>
        {data.length ? (
          data.map((i, idx) => <Item haveNext={idx !== data.length - 1} item={i} key={i[0]} />)
        ) : (
          <div className={'flex-1 flex flex-col'}>
            <NoResult />
          </div>
        )}
      </div>
    </div>
  )
})
const Item = ({ item, haveNext }: { item: [string, IReviewCard[]]; haveNext?: boolean }) => {
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
            name={'park-lightning'}
            className={'p-2 rounded-full bg-secondary text-violet-500 dark:text-violet-700'}
          ></Icon>
          <div className={'w-[1px] bg-secondary h-full'}></div>
        </div>
        <div className={classnames('w-full', haveNext ? 'pb-10' : undefined)}>
          <div className={'flex mb-4 gap-3 items-end'}>
            <div className={'font-semibold text-2xl'}>{DateFormat.formatDate(Number(item[0]))}</div>
            <div className={'font-semibold text-lg'}> {t('review.cards to study', { num: item[1].length })}</div>
          </div>
          <div className={'bg-secondary p-3 rounded-xl'}>
            <div className={'flex gap-5 w-full font-size-13 transparent-font pl-2'}>
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
            {item[1].slice(0, viewMore ? item[1].length : max).map(i => (
              <ReviewHistoryItem hideDate date={'due'} thirdTag showDate={false} card={i} metaId={i.metaId} />
            ))}
            {item[1].length > max && !viewMore && (
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
