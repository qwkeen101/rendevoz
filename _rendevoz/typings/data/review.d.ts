import { IBase } from '..'
import { ReviewLog } from 'ts-fsrs'
export type IReviewStateType = 'again' | 'easy' | 'good' | 'hard'
export type IReviewDue = 'new' | 'learning' | 'review' | 'relearning'
export type IReviewCard = {
  difficulty?: number
  due?: number
  elapsed_days?: number
  ignored?: boolean
  lapses?: number
  last_review?: number
  reps?: number
  scheduled_days?: number
  stability?: number
  state?: number
  metaId: number
  // seconds
  last_time_used?: number
  last_rate?: IReviewStateType
  logs?: (Omit<ReviewLog, 'review' | 'due'> & {
    review: number
    due: number
  })[]
  comments?: {
    createdAt: number
    content: string
    files?: {
      path: string
      type: 'image' | 'file'
      size: number
    }[]
  }[]
} & IBase
export type IReviewFolder = IBase & {
  specType: 'reviewFolder'
  name?: string
  children: {
    type: 'group'
    id: number
  }[]
  workspace?: number
}
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
