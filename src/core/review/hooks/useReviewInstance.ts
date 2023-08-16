import { atom, useAtomValue } from 'jotai'
import { IReviewInstance } from '~/typings'
import * as FSRS from 'fsrs.js'
import { assignProperties } from '@/utils'
import { ObjectStore } from '@/stores'

export const model = new FSRS.FSRS()

export const ReviewInstanceAtom = atom<IReviewInstance>({})

export const useReviewInstance = () => useAtomValue(ReviewInstanceAtom)

export const FsrsRating = FSRS.Rating
export const useAssignReviewInstance = () => {
  const instance = useReviewInstance()
  assignProperties(instance, {
    createCard: async rate => {
      const card = new FSRS.Card()
      const suggestions = model.repeat(card, new Date())
      const nextCard = suggestions[rate]
      await ObjectStore('review').addOne({ card: nextCard.card })
    }
  })
}
