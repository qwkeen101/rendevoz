import { atom, useAtomValue } from 'jotai'
import { IFeedInstance } from '~/typings'

const FeedInstanceAtom = atom<IFeedInstance>({})

const useFeedInstance = () => useAtomValue(FeedInstanceAtom)

export default useFeedInstance
