import { IBase } from '..'

export type IReviewRecord = {
  card: {
    difficulty: number
    due: Date
    elapsed_days: number
    lapses: number
    last_review: Date
    reps: number
    scheduled_days: number
    stability: number
    state: number
  }
  review_log: {
    elapsed_days: number
    rating: number
    review: Date
    scheduled_days: number
    state: number
  }
  comments: {
    createdAt: number
    content: string
  }[]
  metaId: number
} & IBase

export type Card = {}
