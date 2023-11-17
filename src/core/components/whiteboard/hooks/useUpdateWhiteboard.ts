import { useStore } from 'jotai'
import { useFlow, WhiteboardAtom } from '@/core/components/whiteboard/hooks'
import { IWhiteboard } from '~/typings'
import { Draft } from 'immer'

const useUpdateWhiteboard = () => {
  const store = useStore()
  const flow = useFlow()

  const updateWhiteboard = async (update: (draft: Draft<IWhiteboard>) => void, withUndo?: boolean) => {
    const currentState = store.get(WhiteboardAtom)
    if (currentState) {
      const initializedState = {
        ...currentState,
        nodes: currentState.nodes || new Map(),
        edges: currentState.edges || new Map()
      }
      if (flow.cachedRequest.length === 0) {
        flow.cachedRequest.push({
          updater: update,
          withUndo
        })
        await Promise.resolve()
        await flow.batchUpdateWhiteboard(initializedState)
      } else {
        flow.cachedRequest.push({
          updater: update,
          withUndo
        })
      }
    }

    return
  }
  return updateWhiteboard
}
export default useUpdateWhiteboard
