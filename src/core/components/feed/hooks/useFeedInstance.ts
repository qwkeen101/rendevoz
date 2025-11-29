import { atom } from 'jotai'
import { IFeedInstance } from '~/typings'
import { useGlobalAtomValue } from '@/hooks'

const FeedInstanceAtom = atom<IFeedInstance>({})

const useFeedInstance = () => useGlobalAtomValue(FeedInstanceAtom)

export default useFeedInstance
