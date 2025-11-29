import { useTranslation } from 'react-i18next'
import useReviewState from '@/core/components/review/useReviewState'
import NoResult from '@/core/components/common/NoResult'
import trans from '@/consts/trans'
import { ReviewHistoryItem } from '@/core/components/review/home/RecentlyCards'
import { useMemo } from 'react'
const getTime = (d: Date | number) => {
  if (typeof d === 'number') return d
  return d.getTime()
}
export default () => {
  const { t } = useTranslation()
  const state = useReviewState()
  const future = useMemo(() => {
    const due = Object.values(state.futureDue)
      .flat()
      .filter(i => i.due && i.metaId)
    due.sort((a, b) => getTime(a.due!) - getTime(b.due!))
    return due.slice(0, 10)
  }, [state.futureDue])
  if (!future.length) return <NoResult />
  return (
    <div className={'-mx-2'}>
      <div className={'flex gap-5 w-full font-size-12 transparent-font pl-2 mb-1'}>
        <div
          style={{
            width: 180
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
      {future.map(i => (
        <ReviewHistoryItem thirdTag date={'due'} card={i} metaId={i.metaId} key={i.id}></ReviewHistoryItem>
      ))}
    </div>
  )
}
