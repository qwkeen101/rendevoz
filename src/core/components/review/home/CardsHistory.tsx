import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts'
import useReviewState from '@/core/components/review/useReviewState'
import { DateFormat } from '@/utils'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'
import ReviewConsts from '@/core/components/review/ReviewConsts'

export default memo(() => {
  const reviewState = useReviewState()
  const data = useMemo(() => {
    return Object.entries(reviewState.weekSummary)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(i => ({
        name: DateFormat.format(Number(i[0]), DateFormat.Formats.weekday),
        good: i[1].good,
        hard: i[1].hard,
        again: i[1].again,
        total: i[1].good + i[1].hard + i[1].again
      }))
  }, [reviewState.weekSummary])
  const stats = useMemo(() => {
    const result = {
      good: 0,
      hard: 0,
      again: 0,
      total: 0
    }
    Object.values(reviewState.weekSummary).forEach(i => {
      result.good += i.good
      result.hard += i.hard
      result.again += i.again
      result.total += i.good + i.hard + i.again
    })
    return result
  }, [reviewState.weekSummary])
  const { t } = useTranslation()
  const graphContainer = useRef<HTMLDivElement>(null)
  const [maxTickWidth, setTickWidth] = useState(20)
  useEffect(() => {
    const ele = graphContainer.current
      ?.querySelector('.recharts-cartesian-axis-ticks')
      ?.lastElementChild?.querySelector('tspan')
      ?.getBoundingClientRect().width
    if (ele) {
      setTickWidth(ele)
    }
  }, [data])
  return (
    <div
      style={{
        flex: '1 1 0%'
      }}
    >
      <div>{t('review.Last week summary')}</div>
      <div className={'flex items-center mt-1 gap-3'}>
        {[
          ['easy', ReviewConsts.trans.easy],
          ['good', ReviewConsts.trans.good],
          ['hard', ReviewConsts.trans.hard],
          ['again', ReviewConsts.trans.again]
        ]
          .filter(i => stats[i[0]])
          .map(i => (
            <div key={i[0]} className={'font-size-13 transparent-font'}>
              {t(i[1])}:<span className={'primary-font ml-1'}>{stats[i[0]]}</span>
            </div>
          ))}
      </div>
      <div className={'relative w-full mt-3'}>
        <ResponsiveContainer
          ref={graphContainer}
          className={css({
            svg: {
              overflow: 'visible'
            }
          })}
          width="100%"
          height={180}
        >
          <AreaChart
            width={500}
            height={200}
            data={data}
            margin={{
              top: 0,
              right: 0,
              left: 0,
              bottom: 0
            }}
          >
            <XAxis
              tick={{
                fontSize: 11,
                fill: 'var(--font-transparent)'
              }}
              tickLine={false}
              axisLine={{
                stroke: 'var(--font-s-transparent)',
                opacity: 0.2
              }}
              dataKey="name"
            />
            <YAxis
              width={maxTickWidth}
              tick={{
                fontSize: 11,
                fill: 'var(--font-transparent)'
              }}
              tickLine={false}
              axisLine={{
                stroke: 'var(--font-s-transparent)',
                opacity: 0.2
              }}
            />
            <Area
              isAnimationActive={false}
              strokeWidth={1.5}
              fillOpacity={0.4}
              stroke={'#55bd91'}
              fill={'#55bd91'}
              dot={false}
              type={'monotone'}
              dataKey="total"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})
