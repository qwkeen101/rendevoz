import { memo, useMemo } from 'react'
import useReviewState, { useSetReviewState } from '@/core/components/review/useReviewState'
import ReviewContent from '@/core/components/review/viewer/ReviewContent'
import ReviewStore from '@/api/stores/review.store'
import produce from 'immer'
import ReviewFinishedScreen from '@/core/components/review/viewer/ReviewFinishedScreen'

export default memo(() => {
  const reviewState = useReviewState()
  const currentCardIdx = reviewState.currentViewerMetaId
    ? reviewState.scheduledCards.findIndex(i => i.metaId === reviewState.currentViewerMetaId) || 0
    : 0
  const currentCard = reviewState.scheduledCards[currentCardIdx]
  const setReviewState = useSetReviewState()
  const allFinished = useMemo(() => {
    if (!reviewState.scheduledCards.length || reviewState.scheduledCards.every(i => i.reviewed)) {
      return true
    }
    return false
  }, [reviewState.scheduledCards])

  if (allFinished) {
    return <ReviewFinishedScreen />
  }
  return (
    <ReviewContent
      reviewed={reviewState.scheduledCards[currentCardIdx]?.reviewed}
      onNavigate={dir => {
        setReviewState(s =>
          produce(s, draft => {
            const currentCardIdx = draft.currentViewerMetaId
              ? draft.scheduledCards.findIndex(i => i.metaId === draft.currentViewerMetaId) || 0
              : 0
            let idx = currentCardIdx
            if (dir === 'next') {
              idx = currentCardIdx + 1
            } else {
              idx = currentCardIdx - 1
            }
            if (draft.scheduledCards[idx]) {
              draft.currentViewerMetaId = draft.scheduledCards[idx].metaId
            }
          })
        )
      }}
      progress={{
        current: currentCardIdx,
        total: reviewState.scheduledCards.length
      }}
      canNavigate={{
        prev: currentCardIdx !== 0,
        next: currentCardIdx !== reviewState.scheduledCards.length - 1
      }}
      card={{ ...currentCard.card, last_rate: currentCard.reviewed }}
      onReview={(type, time) => {
        if (currentCard) {
          ReviewStore.reviewCard(currentCard.metaId, type, time)
          const nextIdx = currentCardIdx + 1
          setReviewState(s =>
            produce(s, draft => {
              if (type !== 'skip') {
                draft.scheduledCards[currentCardIdx].reviewed = type
                draft.scheduledCards[currentCardIdx].time = time
                draft.scheduledCards[currentCardIdx].reviewAt = Date.now()
              }
              draft.currentViewerMetaId = draft.scheduledCards[nextIdx]?.metaId
            })
          )
        }
      }}
      metaId={currentCard.metaId}
    />
  )
})
