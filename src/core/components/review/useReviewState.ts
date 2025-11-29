import { atom } from 'jotai/index'
import { useAtomValue, useSetAtom } from 'jotai'
import { IReviewCard, IReviewDue, IReviewStateType, MetaObject } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import { createEmptyCard, State } from 'ts-fsrs'
import { isToday, subDays, subWeeks } from 'date-fns'
import { compareStrings } from '@/utils/str'

const getTime = (d: Date | number) => {
  if (typeof d === 'number') return d
  return d.getTime()
}

type ICategory = {
  metaId: number
  card: IReviewCard
}[]
export type IReviewState = {
  futureDue: Record<string, IReviewCard[]>
  weekSummary: Record<
    string,
    {
      again: number
      good: number
      hard: number
    }
  >
  // meta ids
  ignored: number[]
  history: Record<string, IReviewCard[]>
  currentMetas: number[]
  recently: { card: IReviewCard; metaId: number }[]
  timeUsed?: {
    summary: {
      // seconds
      total: number
      average: number
    }
    day: Record<string, number>
  }
  metaIdToCardMap: Map<number, IReviewCard>
  cardIdToMetaIdMap: Map<number, number>
  cardLibraryView: 'all' | IReviewDue
  scheduleSortMode: 'name' | 'difficulty' | 'type' | 'createdAt'
  scheduledCards: {
    metaId: number
    card: IReviewCard
    time?: number
    reviewed?: IReviewStateType
    reviewAt?: number
  }[]
  todayTarget: {
    total: number
    finished: number
    categorized: Record<IReviewStateType, number>
  }
  currentViewerMetaId?: number
  cardMap: Map<number, IReviewCard>
  flipped?: boolean
  categorized: Record<IReviewDue, ICategory>
  groupId?: number
}

const ReviewStateAtom = atom<IReviewState>({
  futureDue: {},
  history: {},
  weekSummary: {},
  recently: [],
  cardLibraryView: 'all',
  currentMetas: [],
  scheduledCards: [],
  cardMap: new Map(),
  metaIdToCardMap: new Map(),
  todayTarget: {
    total: 0,
    finished: 0,
    categorized: {
      again: 0,
      easy: 0,
      hard: 0,
      good: 0
    }
  },
  cardIdToMetaIdMap: new Map(),
  categorized: {
    new: [],
    relearning: [],
    review: [],
    learning: []
  },
  ignored: []
})

export default () => useAtomValue(ReviewStateAtom)
export const useSetReviewState = () => useSetAtom(ReviewStateAtom)
export const calculateReview = async (metas: MetaObject[]) => {
  const ignored: number[] = []
  // meta id => review card
  const reviewCards = new Map<number, IReviewCard>()
  const reviewCardIds: number[] = []
  const cardIdToMetaId = new Map<number, number>()
  const now = Date.now()
  metas.forEach(m => {
    if (m.review) {
      reviewCardIds.push(m.review)
      cardIdToMetaId.set(m.review, m.id)
    } else {
      reviewCards.set(m.id, { ...createEmptyCard(now), metaId: m.id })
    }
  })
  const cards = await ObjectStore('reviewCard').getMultipleByIds(reviewCardIds)
  cards.forEach(c => {
    const mId = c.metaId || cardIdToMetaId.get(c.id)
    if (mId) {
      reviewCards.set(mId, c)
      if (c.ignored) {
        ignored.push(mId)
      }
    }
  })
  const allCards = Array.from(reviewCards.values()).filter(i => !i.ignored)
  const lastWeekTime = subWeeks(new Date(), 1).getTime()
  const lastWeekCards = allCards.filter(i => i.last_review && getTime(i.last_review) > lastWeekTime)
  const inDueCards = allCards.map(i => ({ ...i, metaId: i.metaId || cardIdToMetaId.get(i.id) })) as IReviewCard[]
  return {
    futureDue: groupByTime(inDueCards),
    history: groupByTime(
      allCards.filter(i => i.last_review),
      'last_review'
    ),
    ignored,
    weekSummary: calculateWeekly(lastWeekCards),
    categorized: calculateCategory(allCards, cardIdToMetaId),
    recently: calculateRecently(allCards, cardIdToMetaId),
    cardIdToMetaIdMap: cardIdToMetaId,
    cardMap: reviewCards,
    scheduledCards: calculateSchedule(allCards, cardIdToMetaId),
    todayTarget: calculateToday(allCards),
    metaIdToCardMap: reviewCards,
    currentMetas: metas.map(i => i.id)
  } as IReviewState
}
function groupByTime(elements: IReviewCard[], prop: 'due' | 'last_review' = 'due') {
  const result: IReviewState['futureDue'] = {}
  const now = Date.now()
  elements.forEach(element => {
    let due = element[prop] || now
    const time = getTime(due)
    if (prop === 'due' && time < now) {
      due = now
    }
    const date = new Date(getTime(due))

    // 按天分组键
    const dayKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() // YYYY-MM-DD
    result[dayKey] = result[dayKey] || []
    result[dayKey].push(element)
  })
  return result
}

const calculateWeekly = (elements: IReviewCard[]): IReviewState['weekSummary'] => {
  const grouped = groupByTime(elements, 'last_review')
  const result: IReviewState['weekSummary'] = {}
  for (let i = 0; i < 7; i++) {
    const date = subDays(new Date(), i) // 计算过去第 i 天的日期
    const time = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    result[time] = {
      good: 0,
      hard: 0,
      again: 0
    }
  }

  Object.entries(grouped).forEach(entry => {
    if (!result[entry[0]]) return
    const cards = entry[1]
    const categorized = {
      hard: 0,
      again: 0,
      good: 0
    }
    cards.forEach(card => {
      switch (card.last_rate) {
        case 'again': {
          categorized.again += 1
          break
        }
        case 'good':
        case 'easy': {
          categorized.good += 1
          break
        }
        case 'hard': {
          categorized.hard += 1
          break
        }
      }
    })
    result[entry[0]] = categorized
  })
  return result
}

const calculateCategory = (cards: IReviewCard[], cardIdToMetaId: Map<number, number>): IReviewState['categorized'] => {
  const result: IReviewState['categorized'] = {
    new: [],
    learning: [],
    review: [],
    relearning: []
  }
  cards.forEach(card => {
    const metaId = card.metaId || cardIdToMetaId.get(card.id)
    if (!metaId) return
    switch (card.state) {
      case State.Learning: {
        result.learning.push({
          metaId,
          card
        })
        break
      }
      case State.Relearning: {
        result.relearning.push({
          metaId,
          card
        })
        break
      }
      case State.New: {
        result.new.push({
          metaId,
          card
        })
        break
      }
      case State.Review: {
        result.review.push({
          metaId,
          card
        })
        break
      }
    }
  })
  return result
}

const calculateRecently = (cards: IReviewCard[], cardIdToMetaId: Map<number, number>): IReviewState['recently'] => {
  const recently: IReviewState['recently'] = []
  const reviewed = cards.filter(i => i.last_review)
  reviewed.sort((b, a) => a.last_review! - b.last_review!)
  reviewed.forEach(i => {
    const metaId = i.metaId || cardIdToMetaId.get(i.id)
    if (metaId) {
      recently.push({
        metaId,
        card: i
      })
    }
  })
  return recently
}

const calculateSchedule = (cards: IReviewCard[], cardIdToMetaId: Map<number, number>): IReviewState['scheduledCards'] => {
  const now = Date.now()
  const todayScheduled = cards.filter(i => i.due && (getTime(i.due) < now || isToday(i.due)))
  todayScheduled.sort((a, b) => {
    const aMetaId = a.metaId || cardIdToMetaId.get(a.id)
    const bMetaId = b.metaId || cardIdToMetaId.get(b.id)
    const aM = Global.metaOps.getMetaName(MetaStore.getCachedMetaObject(aMetaId))
    const bM = Global.metaOps.getMetaName(MetaStore.getCachedMetaObject(bMetaId))
    return compareStrings(aM, bM)
  })
  return todayScheduled
    .map(i => ({
      card: i,
      metaId: (i.metaId || cardIdToMetaId.get(i.id))!
    }))
    .filter(i => i.metaId)
}

const calculateToday = (cards: IReviewCard[]) => {
  const result: IReviewState['todayTarget'] = {
    finished: 0,
    total: 0,
    categorized: {
      again: 0,
      hard: 0,
      easy: 0,
      good: 0
    }
  }
  const now = Date.now()
  cards.forEach(card => {
    let isTodayCard = false
    let reviewed = false
    if (card.last_review) {
      if (isToday(getTime(card.last_review))) {
        isTodayCard = true
        reviewed = true
      }
    }
    if (card.due) {
      const dueTime = getTime(card.due)
      if (dueTime < now || isToday(dueTime)) {
        isTodayCard = true
      }
    }
    if (isTodayCard) {
      result.total += 1
      if (reviewed) {
        result.finished += 1
        if (card.last_rate) {
          result.categorized[card.last_rate] += 1
        }
      }
    }
  })
  return result
}

export const calculateDueByGroupId = async (groupId: number) => {
  const group = await ObjectStore('group').getOneById(groupId)
  if (group && group.enableReview) {
    const now = Date.now()
    let count = 0
    const allValidMetas = Array.from(new Set(group.values.map(i => i.id).values()))
      .map(i => MetaStore.getCachedMetaObject(i))
      .filter(i => i?.review !== false)
    const cardsMap = new Map(
      (
        await ObjectStore('reviewCard').getMultipleByIds(
          allValidMetas.map(i => i?.review).filter(i => i),
          false
        )
      ).map(i => [i.id, i])
    )
    await Promise.all(
      allValidMetas.map(async i => {
        if (!i?.review) {
          count += 1
          return
        } else {
          const card = cardsMap.get(i.review)
          if (!card || !card.due) {
            count += 1
            return
          } else {
            const time = getTime(card.due)
            if (time < now || isToday(time)) {
              count += 1
            }
          }
        }
      })
    )
    return count
  }
  return 0
}
