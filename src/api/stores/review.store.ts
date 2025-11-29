import { IReviewCard, IReviewStateType } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import { reviewCard } from '@/core/review/fsrs'
import { createEmptyCard } from 'ts-fsrs'

const ReviewStore = {
  updateCard: async (metaId: number, card: Partial<IReviewCard> | ((curr: Partial<IReviewCard>) => Partial<IReviewCard>)) => {
    const m = MetaStore.getCachedMetaObject(metaId)
    if (m) {
      const c = m.review ? await ObjectStore('reviewCard').getOneById(m.review) : undefined
      if (c) {
        const final = typeof card === 'object' ? { ...card } : card({ ...c, metaId, comments: c.comments || [] })
        await ObjectStore('reviewCard').updateOne({ id: c.id, ...final })
      } else {
        const final = typeof card === 'object' ? { ...card } : card({ metaId, comments: [] })
        const result = await ObjectStore('reviewCard').addOne({ ...final })
        await MetaStore.updateMetaObject({ id: metaId, review: result.id })
      }
    }
  },
  reviewCard: async (metaId: number | number[], type: IReviewStateType, time?: number) => {
    const ids = Array.isArray(metaId) ? metaId : [metaId]
    await Promise.all(
      ids.map(async id => {
        const meta = MetaStore.getCachedMetaObject(id)
        if (!meta) return
        const card = meta.review ? await ObjectStore('reviewCard').getOneById(meta.review) : undefined
        await ReviewStore.updateCard(id, { ...reviewCard(card, type), metaId: id, last_time_used: time })
      })
    )
  },
  unignoreCard: async (metaId: number | number[]) => {
    const ids = Array.isArray(metaId) ? metaId : [metaId]
    await Promise.all(
      ids.map(async id => {
        const m = MetaStore.getCachedMetaObject(id)
        if (m?.review) {
          await ObjectStore('reviewCard').updateOne({ id: m.review, ignored: false })
        }
      })
    )
  },
  resetProgress: async (metaId: number | number[]) => {
    const ids = Array.isArray(metaId) ? metaId : [metaId]
    await Promise.all(
      ids.map(async id => {
        const m = MetaStore.getCachedMetaObject(id)
        if (m?.review) {
          await ObjectStore('reviewCard').updateOne({
            ...createEmptyCard(Date.now()),
            id: m.review,
            last_time_used: undefined,
            last_rate: undefined,
            logs: []
          })
        }
      })
    )
  },
  ignoreCard: async (metaId: number | number[]) => {
    const ids = Array.isArray(metaId) ? metaId : [metaId]
    await Promise.all(
      ids.map(async id => {
        const m = MetaStore.getCachedMetaObject(id)
        if (m?.review) {
          await ObjectStore('reviewCard').updateOne({ id: m.review, ignored: true })
        }
      })
    )
  }
}

export default ReviewStore
