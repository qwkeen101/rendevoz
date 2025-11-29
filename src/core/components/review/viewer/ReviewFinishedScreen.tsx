import { memo, useEffect, useMemo, useState } from 'react'
import useReviewState from '@/core/components/review/useReviewState'
import ReviewConsts from '@/core/components/review/ReviewConsts'
import { sum } from 'lodash'
import formatEpisodeDuration from '@/core/components/podcast/utils/formatEpisodeDuration'
import { Icon } from '@/components'
import { ReviewHistoryItem } from '@/core/components/review/home/RecentlyCards'
import ReviewRateTag from '@/core/components/review/ReviewRateTag'
import { useTranslation } from 'react-i18next'
import { useNorepeatNavigate } from '@/hooks'
import { motion, AnimatePresence } from 'framer-motion'

export default memo(() => {
  const state = useReviewState()
  const history = useMemo(() => {
    const sorted = state.scheduledCards.filter(i => i.reviewed).sort((b, a) => a.reviewAt! - b.reviewAt!)
    return sorted
  }, [state.scheduledCards])
  const { t } = useTranslation()
  const nav = useNorepeatNavigate()
  const { pie, total, timeUsed } = useMemo(() => {
    const result = {
      again: 0,
      easy: 0,
      good: 0,
      hard: 0
    }
    state.scheduledCards.forEach(i => {
      if (i.reviewed) {
        result[i.reviewed] += 1
      }
    })
    const total = result.again + result.easy + result.good + result.hard
    return {
      pie: Object.entries(result)
        .map(i => ({
          name: i[0],
          value: i[1],
          color: ReviewConsts.colors[i[0]],
          precent: i[1] / total
        }))
        .filter(i => i.value),
      timeUsed: sum(state.scheduledCards.map(i => i.time ?? 0)),
      total
    }
  }, [state.scheduledCards])
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    setTimeout(() => setVisible(false), 1500)
  }, [])
  return (
    <div className={'w-full h-full overflow-y-auto relative'}>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{
              x: '-50%',
              y: '-30%',
              opacity: 0
            }}
            animate={{
              y: '-50%',
              x: '-50%',
              opacity: 1
            }}
            transition={{
              duration: 0.28
            }}
            exit={{
              y: '-30%',
              x: '-50%',
              opacity: 0
            }}
            className={
              'left-1/2 bg-secondary text-center rounded-3xl z-20 top-1/2 absolute p-10 -translate-x-1/2 -translate-y-1/2 flex flex-col'
            }
          >
            <div
              style={{
                fontSize: 64,
                lineHeight: 1
              }}
            >
              🎉
            </div>
            <div className={'text-2xl font-bold mt-6'}>{t('review.Congrats')}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={'container-5xl @container p-7 pt-16'}>
        <div className={'flex mb-6 items-center gap-3'}>
          <Icon
            onClick={() =>
              nav('/dashboard', {
                replace: true
              })
            }
            name={'park-arrow-left'}
            className={'square-button'}
            size={24}
          />
          <div className={'font-semibold text-3xl'}>{t('review.Study summary')}</div>
        </div>
        <div className={'flex flex-col'}>
          <div className={'flex gap-6'}>
            <div className={'rounded-2xl p-6 bg-secondary justify-center flex-1 flex flex-col items-start'}>
              <Icon name={'custom-review-card'} className={'transparent-font mb-3'} size={28} />
              <div className={'transparent-font mb-1'}>{t('review.Cards studied')}</div>
              <div className={'text-2xl font-bold'}>{total}</div>
            </div>
            <div className={'rounded-2xl p-6 bg-secondary justify-center flex-1 flex flex-col items-start'}>
              <Icon strokeWidth={2.5} name={'park-time'} className={'transparent-font mb-3'} size={28} />
              <div className={'transparent-font mb-1'}>{t('review.Time used')}</div>
              <div className={'text-2xl font-bold'}>{formatEpisodeDuration(timeUsed)}</div>
            </div>
            <div className={'rounded-2xl p-6 bg-secondary flex-1 flex flex-col items-start'}>
              <Icon strokeWidth={2.5} className={'transparent-font mb-3'} size={28} name={'park-system'} />
              <div className={'transparent-font mb-3'}>{t('review.Ratings')}</div>
              <div className={'flex gap-2 items-center flex-wrap'}>
                {pie.map(i => (
                  <ReviewRateTag count={i.value} rate={i.name} key={i.name} />
                ))}
              </div>
            </div>
          </div>
          <div className={'-mx-2 mt-6'}>
            <div className={'font-medium text-xl pl-2 mb-2'}>{t('review.Cards studied')}</div>
            {history.map(i => (
              <ReviewHistoryItem
                showDate={false}
                metaId={i.metaId}
                card={{
                  last_rate: i.reviewed,
                  last_review: i.reviewAt || Date.now()
                }}
                key={i.metaId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})
