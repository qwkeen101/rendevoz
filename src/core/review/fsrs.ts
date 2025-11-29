import { createEmptyCard, Rating, FSRS, RecordLogItem } from 'ts-fsrs'
import { IReviewCard, IReviewStateType } from '~/typings'
export const ReviewRateToNumber: Record<ReviewStateType, number> = {
  easy: 4,
  skip: 999,
  hard: 2,
  good: 3,
  again: 1
}
const getTime = (d?: Date | number) => {
  if (d === undefined) return Date.now()
  if (typeof d === 'number') return d
  return d.getTime()
}
export type ReviewStateType = 'skip' | 'again' | 'easy' | 'good' | 'hard'

export const reviewCard = (card: Partial<IReviewCard> | undefined = {}, type: IReviewStateType): Partial<IReviewCard> => {
  const fsrs = new FSRS({})
  const now = new Date()
  const empty = createEmptyCard(now)
  const created = { ...empty, ...card }
  const scheduling = fsrs.repeat(created, now)
  let final: RecordLogItem
  switch (type) {
    case 'again':
      final = scheduling[Rating.Again]
      break
    case 'easy':
      final = scheduling[Rating.Easy]
      break
    case 'good':
      final = scheduling[Rating.Good]
      break
    case 'hard':
      final = scheduling[Rating.Hard]
      break
  }
  return {
    ...final.card,
    last_review: final.card.last_review?.getTime(),
    due: final.card.due.getTime(),
    last_rate: type,
    logs: [...(card.logs || []), { ...final.log, review: final.log.review.getTime(), due: final.log.due.getTime() }]
  }
}
export const getScheduling = (card?: IReviewCard): Record<IReviewStateType, Date> => {
  const now = new Date()
  const fsrs = new FSRS({})
  const c = (card || createEmptyCard(now))!
  const scheduling = fsrs.repeat({ ...c, due: c.due || now }, now)
  return {
    easy: scheduling[Rating.Easy].card.due,
    hard: scheduling[Rating.Hard].card.due,
    good: scheduling[Rating.Good].card.due,
    again: scheduling[Rating.Again].card.due
  }
}
