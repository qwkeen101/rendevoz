import { IBase } from '..'
export type ReviewStateType = 'skip' | 'again' | 'easy' | 'good' | 'hard'
export type IReviewCard = {
  difficulty: number
  due: Date
  elapsed_days: number
  lapses: number
  last_review: Date
  reps: number
  scheduled_days: number
  stability: number
  state: number
  metaId: number
  last_rate: ReviewStateType
  comments?: {
    createdAt: number
    content: string
  }[]
} & IBase

export type IReviewRecord = {
  card: {}
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
