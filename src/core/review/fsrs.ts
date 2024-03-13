import * as fsrsJs from 'fsrs.js'
import { Card, Rating } from 'fsrs.js'
export const ReviewRateToNumber: Record<ReviewStateType, number> = {
  easy: 4,
  skip: 999,
  hard: 2,
  good: 3,
  again: 1
}

export type ReviewStateType = 'skip' | 'again' | 'easy' | 'good' | 'hard'
export const initializeReviewCard = (type: ReviewStateType) => {
  const fsrs = new fsrsJs.FSRS()
  const card = new fsrsJs.Card()
  const now = new Date()
  if (type === 'skip') {
    return { ...card, due: new Date(now.getTime() + 60 * 60 * 1000) }
  }
  const scheduling = fsrs.repeat(card, new Date())
  switch (type) {
    case 'again':
      return { ...scheduling[Rating.Again].card, last_rate: type }
    case 'easy':
      return { ...scheduling[Rating.Easy].card, last_rate: type }
    case 'good':
      return { ...scheduling[Rating.Good].card, last_rate: type }
    case 'hard':
      return { ...scheduling[Rating.Hard].card, last_rate: type }
  }
}
export const reviewCard = (card: Card, type: ReviewStateType) => {
  const fsrs = new fsrsJs.FSRS()
  if (type === 'skip') {
    return { ...card, due: new Date(card.due.getTime() + 60 * 60 * 1000) }
  }
  const scheduling = fsrs.repeat(card, new Date())
  switch (type) {
    case 'again':
      return { ...scheduling[Rating.Again].card, last_rate: type }
    case 'easy':
      return { ...scheduling[Rating.Easy].card, last_rate: type }
    case 'good':
      return { ...scheduling[Rating.Good].card, last_rate: type }
    case 'hard':
      return { ...scheduling[Rating.Hard].card, last_rate: type }
  }
}
export const getScheduling = (card?: Card): Record<ReviewStateType, Date> => {
  const now = new Date()
  const fsrs = new fsrsJs.FSRS()
  const scheduling = fsrs.repeat(card || new fsrsJs.Card(), now)
  return {
    skip: new Date(now.getTime() + 60 * 60 * 1000),
    easy: scheduling[Rating.Easy].card.due,
    hard: scheduling[Rating.Hard].card.due,
    good: scheduling[Rating.Good].card.due,
    again: scheduling[Rating.Again].card.due
  }
}
