import useReviewState, { useSetReviewState } from '@/core/components/review/useReviewState'
import { IReviewCard, IReviewStateType } from '~/typings'
import { MetaStore } from '@/api/stores'
import { VirtualList } from '@/components'
import { memo } from 'react'
import ReviewConsts from '@/core/components/review/ReviewConsts'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'

export default memo(() => {
  const state = useReviewState()
  const cards = state.scheduledCards
  return (
    <div className={'flex-1 pl-6'}>
      <div className={'font-size-16'}>Scheduled cards</div>
      <VirtualList
        style={{
          width: '100%',
          height: '100%'
        }}
        estimateSize={30}
        className={'no-scrollbar'}
        items={cards}
        renderItem={(i, idx) => <Item metaId={i.metaId} card={i.card} reviewed={i.reviewed} />}
      />
    </div>
  )
})

const Item = memo(({ card, metaId, reviewed }: { card: IReviewCard; metaId: number; reviewed?: IReviewStateType }) => {
  const m = MetaStore.useValue(metaId)
  const { t } = useTranslation()
  const setReviewState = useSetReviewState()
  if (m) {
    const name = Global.metaOps.getMetaName(m)
    return (
      <div
        onClick={() => {
          setReviewState(s => ({ ...s, currentViewerMetaId: m.id }))
        }}
        className={'flex items-center gap-3 py-1 relative'}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            flexShrink: 0,
            background: reviewed ? ReviewConsts.colors[reviewed] : 'var(--font-s-transparent)'
          }}
        ></div>
        <div className={classnames('line-clamp-1', !name && 'super-transparent-font')}>{name || t(trans.Unnamed)}</div>
      </div>
    )
  }
})
