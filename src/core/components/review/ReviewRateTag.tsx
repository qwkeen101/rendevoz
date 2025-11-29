import { IReviewStateType } from '~/typings'
import ReviewConsts from '@/core/components/review/ReviewConsts'
import { Colors } from '@/consts'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export default memo(({ rate, count }: { rate: IReviewStateType; count: number }) => {
  const color = ReviewConsts['colors'][rate]
  const { t } = useTranslation()
  return (
    <div className={'relative px-3 font-size-13 rounded-2xl overflow-hidden'}>
      <div
        style={{
          background: color,
          opacity: 0.2
        }}
        className={'absolute inset-0'}
      ></div>
      <div
        style={{
          color: Colors.getAdaptFontColor(color)
        }}
        className={'whitespace-nowrap'}
      >
        {t(ReviewConsts.trans[rate])} · {count}
      </div>
    </div>
  )
})
