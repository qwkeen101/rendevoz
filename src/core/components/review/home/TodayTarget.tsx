import useReviewState from '@/core/components/review/useReviewState'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { memo, useMemo } from 'react'
import { GlobalSetting } from '@/core'
import { useTranslation } from 'react-i18next'
import ReviewConsts from '@/core/components/review/ReviewConsts'
import { startOfToday } from 'date-fns'
import classnames from 'classnames'
import { Icon } from '@/components'

export default memo(() => {
  const state = useReviewState()
  const { t } = useTranslation()
  const { todayTarget, history } = state
  const darkMode = GlobalSetting.useSelectSettingAtom('darkMode')
  const data = useMemo(() => {
    const res = []
    if (todayTarget.finished) {
      res.push({
        name: 'finished',
        value: todayTarget.finished,
        color: darkMode ? '#f6c956' : '#f6c956'
      })
    }
    if (todayTarget.finished !== todayTarget.total) {
      res.push({
        name: 'total',
        value: todayTarget.total - todayTarget.finished,
        color: darkMode ? '#373737' : '#eff1f3'
      })
    }
    return res
  }, [todayTarget, darkMode])
  const todayHistory = useMemo(() => {
    const todayStart = history[startOfToday().getTime()]
    const categorized = {
      again: 0,
      easy: 0,
      good: 0,
      hard: 0
    }
    if (todayStart) {
      todayStart.forEach(c => {
        if (c.last_rate) {
          categorized[c.last_rate] += 1
        }
      })
    }
    return Object.entries(categorized)
      .filter(i => i[1])
      .sort((b, a) => b[1] - a[1])
  }, [history])
  return (
    <div className={'flex-1 p-6 rounded-2xl bg-secondary'}>
      <div className={'mb-6 flex gap-2 items-center menu-sub-title'}>
        <Icon name={'park-rocket-one'} size={15} />
        {t("review.Today's goal")}
      </div>
      <div
        className={classnames('flex flex-row-reverse items-center w-full gap-12', todayTarget.total ? 'justify-between' : 'justify-center')}
      >
        {todayTarget.total ? (
          <div className={'flex-1 flex flex-col gap-2 w-full'}>
            <div className={'flex-1 gap-4 flex items-center'}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  border: `1.5px solid #55bd91`,
                  borderRadius: '50%'
                }}
              ></div>
              <div className={'transparent-font mr-auto'}>{t('review.Studied')}</div>
              <div>{todayTarget.finished}</div>
            </div>
            {todayHistory.map(i => (
              <div key={i[0]} className={'flex-1 gap-4 flex items-center'}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    border: `1.5px solid ${ReviewConsts.colors[i[0]]}`,
                    borderRadius: '50%'
                  }}
                ></div>
                <div className={'transparent-font mr-auto'}>{t(ReviewConsts.trans[i[0]])}</div>
                <div>{i[1]}</div>
              </div>
            ))}
            <div className={'flex-1 gap-4 flex items-center'}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  border: `1.5px solid #9e9e9e`,
                  borderRadius: '50%'
                }}
              ></div>
              <div className={'transparent-font mr-auto'}>{t('review.Total')}</div>
              <div>{todayTarget.total}</div>
            </div>
          </div>
        ) : null}
        {todayTarget.total ? (
          <ResponsiveContainer width={134} height={134}>
            <PieChart>
              <g>
                <text fontWeight={600} fontSize={20} x={'50%'} y={'50%'} dy={-5} textAnchor={'middle'} fill={'var(--font-primary)'}>
                  {(Math.max(state.todayTarget.finished / state.todayTarget.total, state.todayTarget.finished ? 0.01 : 0) * 100).toFixed(0)}
                  %
                </text>
                <text fontSize={13} x={'50%'} y={'50%'} dy={14} textAnchor={'middle'} fill={'var(--font-transparent)'}>
                  {t('review.studied')}
                </text>
              </g>
              <Pie
                isAnimationActive={false}
                outerRadius={67}
                innerRadius={60}
                cornerRadius={6}
                paddingAngle={data.length > 1 ? 5 : 0}
                stroke={'transparent'}
                dataKey={'value'}
                data={data}
              >
                {data.map(i => (
                  <Cell fill={i.color} key={i.name} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className={'py-20 transparent-font font-medium'}>{t('review.No cards')}</div>
        )}
      </div>
    </div>
  )
})
