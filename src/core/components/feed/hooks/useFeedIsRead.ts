import useFeedState from '@/core/components/feed/hooks/useFeedState'
import { useAtomValue } from 'jotai/react'

export default (feedItemId: number) => {
  const isRead = useAtomValue(useFeedState.alreadyReadIdsAtom).has(feedItemId)
  return isRead
}
