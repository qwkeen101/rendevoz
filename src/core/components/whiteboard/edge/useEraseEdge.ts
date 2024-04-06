import { useEffect, useState } from 'react'
import { useMemoizedFn } from '@/hooks'
import { WhiteboardStateAtom } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import { useFlow } from '@/core/components/whiteboard/StateHooks'
import { selectAtom } from 'jotai/utils'
import { useAtomValue } from 'jotai'

const isErasingAtom = selectAtom(WhiteboardStateAtom, s => s.erasing)
const useEraseEdge = (edgeId: number) => {
  const isErasing = useAtomValue(isErasingAtom)
  const flow = useFlow()
  const [isTouched, setIsTouched] = useState(false)
  const handlePointerEvent = useMemoizedFn((e: PointerEvent) => {
    if (!isErasing) {
      return
    }
    if (e.type === 'pointerenter') {
      flow.erasedEdgeIds.add(edgeId)
      setIsTouched(true)
    }
  })
  useEffect(() => {
    if (isErasing === false) {
      setIsTouched(false)
    }
  }, [isErasing])
  return {
    isTouched,
    handlePointerEvent,
    isErasing
  }
}

export default useEraseEdge
