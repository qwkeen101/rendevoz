import { memo, useState } from 'react'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import ReviewCalendar from '@/core/components/review/home/ReviewCalendar'
import CardsHistory from '@/core/components/review/home/CardsHistory'
import FutureDue from '@/core/components/review/home/FutureDue'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import { Icon } from '@/components'

export default memo(() => {
  const { t } = useTranslation()
  const view = KeyvalueStore.useValue('reviewStatsView') ?? 'chart'
  return (
    <div className={'w-full p-6 rounded-2xl bg-secondary'}>
      <div className={'flex justify-between mb-3'}>
        <div className={'menu-sub-title flex gap-2 items-start'}>
          <Icon size={16} name={'park-chart-line'} />
          {t('review.Statistics')}
        </div>
        <div className={'flex bg-third p-1 rounded-2xl transparent-font'}>
          {['chart', 'calendar'].map(i => (
            <div
              key={i}
              className={classnames(
                'capitalize font-size-12 py-0.5 px-3 rounded-2xl cursor-pointer',
                i === view ? 'bg-button-hover primary-font' : 'hover-bg-hover'
              )}
              onClick={() => KeyvalueStore.updateOne('reviewStatsView', i)}
            >
              {t(`review.${i}`)}
            </div>
          ))}
        </div>
      </div>
      {view === 'calendar' ? (
        <ReviewCalendar />
      ) : (
        <div className={'flex w-full gap-16'}>
          <CardsHistory />
          <FutureDue />
        </div>
      )}
    </div>
  )
})
