import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import ReviewDashboard from '@/core/components/review/ReviewDashboard'
import { calculateReview, useSetReviewState } from '@/core/components/review/useReviewState'
import { useEffect, useMemo } from 'react'
import { MetaStore } from '@/api/stores'
import { MetaObject } from '~/typings'
import ReviewHeader from '@/core/components/review/ReviewHeader'
import ReviewCards from '@/core/components/review/ReviewCards'
import ReviewHistory from '@/core/components/review/ReviewHistory'
import ReviewViewer from '@/core/components/review/viewer/ReviewViewer'
import useReviewInstance from '@/core/components/review/useReviewInstance'
import produce from 'immer'
import ReviewStore from '@/api/stores/review.store'
import ReviewFutureCards from '@/core/components/review/ReviewFutureCards'

const ReviewWrapper = ({ onBackGroup }: { onBackGroup?: VoidFunction }) => {

  return (
    <div className={'flex flex-col w-full h-full'}>
      <ReviewHeader onBackGroup={onBackGroup} />
      <div className={'w-full overflow-hidden flex-1'}>
        <Outlet />
      </div>
    </div>
  )
}

export default ({ currentMetas, onBackGroup, groupId }: { currentMetas: number[]; onBackGroup?: VoidFunction; groupId?: number }) => {
  const setReviewState = useSetReviewState()
  const reviewInstance = useReviewInstance()
  reviewInstance.index = schedule => {
    const metas = currentMetas.map(i => MetaStore.getCachedMetaObject(i)).filter(i => i) as MetaObject[]
    calculateReview(metas).then(res => {
      setReviewState(s => ({ ...s, ...res, scheduledCards: schedule ? res.scheduledCards : s.scheduledCards }))
    })
  }
  reviewInstance.unignore = async m => {
    ReviewStore.unignoreCard(m).then(() => {
      reviewInstance.index?.(true)
    })
  }
  reviewInstance.ignoreScheduledCard = m => {
    const ids = Array.isArray(m) ? m : [m]
    setReviewState(s =>
      produce(s, draft => {
        const currentIdx = draft.scheduledCards.findIndex(i => i.metaId === draft.currentViewerMetaId) || 0
        draft.scheduledCards = draft.scheduledCards.filter(i => !ids.includes(i.metaId))
        if (!draft.scheduledCards.length) return
        if (draft.currentViewerMetaId && ids.includes(draft.currentViewerMetaId)) {
          const next = draft.scheduledCards.findIndex((i, idx) => idx >= currentIdx && !i.reviewed)
          if (next < 0) {
            const first = draft.scheduledCards.findIndex(i => !i.reviewed)
            if (first >= 0) {
              draft.currentViewerMetaId = draft.scheduledCards[first].metaId
            } else {
              draft.currentViewerMetaId = draft.scheduledCards[0].metaId
            }
          } else {
            draft.currentViewerMetaId = draft.scheduledCards[next].metaId
          }
        }
      })
    )
    ReviewStore.ignoreCard(ids).then(() => {
      reviewInstance.index?.()
    })
  }
  useEffect(() => {
    reviewInstance.index?.(true)
  }, [currentMetas])
  useEffect(() => {
    if (groupId && typeof groupId === 'number') {
      setReviewState(s => ({ ...s, groupId }))
    }
  }, [groupId])
  const ReviewRouter = useMemo(
    () =>
      createMemoryRouter(
        [
          {
            element: <ReviewWrapper onBackGroup={onBackGroup} />,
            path: '/',
            children: [
              {
                element: <ReviewDashboard />,
                path: '/dashboard'
              },
              {
                element: <ReviewCards />,
                path: '/cards'
              },
              {
                element: <ReviewHistory />,
                path: '/history'
              },
              {
                element: <ReviewViewer />,
                path: '/viewer'
              },
              {
                element: <ReviewFutureCards />,
                path: '/future'
              }
            ]
          }
        ],
        {
          initialEntries: ['/dashboard']
        }
      ),
    []
  )
  return <RouterProvider router={ReviewRouter}></RouterProvider>
}
