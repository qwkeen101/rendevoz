import { useAtomValue } from 'jotai/react'
import useFeedState from '@/core/components/feed/hooks/useFeedState'

export default (id: number) => {
  const v = useAtomValue(useFeedState.currentFeedIdAtom)
  return id === v
}
