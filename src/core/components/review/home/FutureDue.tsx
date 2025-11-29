import useReviewState from '../useReviewState'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BarChart, Bar, Rectangle, XAxis, Line, YAxis, Area, ResponsiveContainer, AreaChart, LineChart } from 'recharts'
import { DateFormat } from '@/utils'
import { Colors } from '@/consts'
import { startOfDay, startOfToday } from 'date-fns'
import { sum } from 'lodash'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'

export default memo(() => {
  const reviewState = useReviewState()
  const due = reviewState.futureDue
  const [mode, setMode] = useState<30 | 90 | 365>(30)
  const data = useMemo(() => {
    const days = mode
    const today = new Date()
    const result: { name: string; value: number; total: number }[] = []
    let total = 0
    for (let i = 0; i < days; i++) {
      const day = new Date()
      day.setDate(today.getDate() + i)
      const dayStart = startOfDay(day).getTime()
      const items = due[dayStart]
      total += items?.length ?? 0
      result.push({
        name: `${i}`,
        value: items?.length ?? 0,
        total: total
      })
    }
    return result
  }, [due, mode])
  const stat = useMemo(() => {
    const total = sum(data.map(i => i.value))
    const average = Math.max(Math.round(total / mode), 1)
    return {
      total,
      average,
      max: Math.max(...data.map(i => i.value))
    }
  }, [data])
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
      <div>{t('review.Future due')}</div>
      {stat.total ? (
        <div className={'flex items-center gap-3 mt-1 transparent-font font-size-12'}>
          <div>
            {t('review.Total')}: <span className={'primary-font ml-1'}>{stat.total}</span>
          </div>
          <div>
            {t('review.Average')}: <span className={'primary-font ml-1'}>{stat.average}</span>
          </div>
        </div>
      ) : null}
      <div className={'mt-3'}>
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
            data={data}
            width={500}
            height={200}
            margin={{
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }}
          >
            <XAxis
              dataKey="name"
              tick={{
                fontSize: 11,
                fill: 'var(--font-transparent)'
              }}
              tickLine={false}
              axisLine={{
                stroke: 'var(--font-s-transparent)',
                opacity: 0.2
              }}
              minTickGap={25}
              domain={['auto', 'auto']}
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
              dataKey={'value'}
            />
            <Area
              isAnimationActive={false}
              fillOpacity={0.4}
              strokeWidth={1.5}
              type={'monotone'}
              stroke={'#559bbd'}
              fill={'#559bbd'}
              dataKey="value"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})
