import { memo, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IReviewDue } from '~/typings'
import useReviewState from '@/core/components/review/useReviewState'
import { sum } from 'lodash'
import ReviewConsts from '@/core/components/review/ReviewConsts'
import classnames from 'classnames'
import { PieChart, Pie, ResponsiveContainer, Cell } from 'recharts'
import NoResult from '@/core/components/common/NoResult'
export default memo(() => {
  const reviewState = useReviewState()
  const { t } = useTranslation()
  const { categorized } = reviewState
  const total = useMemo(() => sum(Object.values(categorized).map(i => i.length)), [categorized])
  const data = useMemo(
    () =>
      Object.entries(categorized)
        .map(i => ({
          name: i[0],
          color: ReviewConsts.colors[i[0]],
          value: i[1].length
        }))
        .filter(i => i.value),
    [categorized]
  )
  if (!total) {
    return (
      <div className={'w-full py-20 flex flex-col items-center justify-center'}>
        <div className={'transparent-font font-medium'}>{t('review.No cards')}</div>
      </div>
    )
  }
  return (
    <div className={'flex flex-row-reverse w-full items-center justify-between gap-12'}>
      <div className={'flex flex-col flex-1 w-full gap-2'}>
        {(['new', 'learning', 'review', 'relearning', 'ignored'] as IReviewDue[]).map((i, idx) => (
          <div key={i} className={'flex-1 gap-4 flex items-center'}>
            <div
              style={{
                width: 8,
                height: 8,
                border: `1.5px solid ${ReviewConsts.colors[i]}`,
                borderRadius: '50%'
              }}
            ></div>
            <div className={'transparent-font mr-auto'}>{t(`review.${i}`)}</div>
            <div>{{ ...categorized, ignored: reviewState.ignored }[i].length}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width={134} height={134}>
        <PieChart>
          <g>
            <text x={'50%'} y={'50%'} fontSize={20} fontWeight={600} dy={-5} fill={'var(--font-primary)'} textAnchor={'middle'}>
              {total}
            </text>
            <text x={'50%'} y={'50%'} dy={14} textAnchor={'middle'} fontSize={13} fill={'var(--font-transparent)'}>
              {t('review.cards')}
            </text>
          </g>
          <Pie
            isAnimationActive={false}
            dataKey={'value'}
            paddingAngle={data.length > 1 ? 6 : 0}
            cornerRadius={8}
            outerRadius={67}
            innerRadius={60}
            data={data}
          >
            {data.map(i => (
              <Cell stroke={'transparent'} fill={i.color} key={i.name} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
})
