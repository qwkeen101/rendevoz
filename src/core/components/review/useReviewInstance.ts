import { atom } from 'jotai/index'
import { useAtomValue } from 'jotai'

export type IReviewInstance = Partial<{
  index: (schedule?: boolean) => void
  ignoreScheduledCard: (metaId: number | number[]) => void
  unignore: (metaId: number | number[]) => void
}>
export const ReviewInstanceAtom = atom<IReviewInstance>({})

export default () => useAtomValue(ReviewInstanceAtom)
