import useReviewState, { useSetReviewState } from '@/core/components/review/useReviewState'
import { IReviewCard, IReviewStateType } from '~/typings'
import { MetaStore } from '@/api/stores'
import { VirtualList } from '@/components'
import { memo, useMemo } from 'react'
import ReviewConsts from '@/core/components/review/ReviewConsts'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import usePreviewItem from '@/components/layout/sidebar/usePreviewItem'

export default memo(({ current, onClose }: { current: number; onClose?: VoidFunction }) => {
  const state = useReviewState()
  const cards = state.scheduledCards
  const categorized = useMemo(() => {
    const result = {
      categorized: {
        easy: 0,
        good: 0,
        hard: 0,
        again: 0
      },
      total: cards.length,
      finished: 0
    }
    cards.forEach(c => {
      if (c.reviewed) {
        result.categorized[c.reviewed] += 1
        result.finished += 1
      }
    })
    return result
  }, [cards])
  const { t } = useTranslation()
  return (
    <>
      <div className={'py-2 px-3 border-bottom'}>
        <div className={'flex justify-between'}>
          <div className={'font-semibold'}>{t('review.Card list')}</div>
          <div className={'flex items-center gap-3 font-size-12 transparent-font'}>
            {Object.entries(categorized.categorized)
              .filter(i => i[1])
              .map(i => (
                <div className={'flex items-center gap-1.5'} key={i[0]}>
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: ReviewConsts.colors[i[0]]
                    }}
                  ></div>
                  <div>{i[1]}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
      <VirtualList
        style={{
          width: 360,
          maxHeight: 400,
          padding: '0.25rem'
        }}
        estimateSize={30}
        initialFocusIndex={current}
        items={cards}
        renderItem={(i, idx) => (
          <Item onClose={onClose} preview={false} isCurrent={idx === current} metaId={i.metaId} card={i.card} reviewed={i.reviewed} />
        )}
      />
    </>
  )
})

const Item = memo(
  ({
    card,
    metaId,
    reviewed,
    isCurrent,
    onClose,
    preview
  }: {
    card: IReviewCard
    metaId: number
    reviewed?: IReviewStateType
    isCurrent?: boolean
    preview?: boolean
    onClose?: VoidFunction
  }) => {
    const m = MetaStore.useValue(metaId)
    const { t } = useTranslation()
    const setReviewState = useSetReviewState()
    const { wrapper } = usePreviewItem(preview ?? false, metaId)
    if (m) {
      const name = Global.metaOps.getMetaName(m)
      return wrapper(
        <div
          onClick={() => {
            onClose?.()
            setReviewState(s => ({ ...s, currentViewerMetaId: m.id }))
          }}
          className={classnames('flex items-center gap-3 button relative')}
        >
          {isCurrent && <div className={'absolute rounded-lg inset-0 select-color-super-transparent-bg select-color-box-shadow'}></div>}
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
        </div>,
        'center'
      )
    }
  }
)
