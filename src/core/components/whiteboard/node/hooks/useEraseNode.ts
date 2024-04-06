import { useEffect, useState } from 'react'
import { useMemoizedFn, useSelectAtomValue } from '@/hooks'
import { WhiteboardStateAtom } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import { useFlow } from '@/core/components/whiteboard/StateHooks'
import { IWhiteboardNode } from '~/typings'
import { getSetting } from '@/core'
import { selectAtom } from 'jotai/utils'
import { useAtomValue } from 'jotai'

const isErasingAtom = selectAtom(WhiteboardStateAtom, s => s.erasing)
const useEraseNode = (node: IWhiteboardNode) => {
  const isErasing = useAtomValue(isErasingAtom)
  const flow = useFlow()
  const [isTouched, setIsTouched] = useState(false)
  const handlePointerEvent = useMemoizedFn((e: PointerEvent) => {
    if (!isErasing) {
      return
    }
    if (e.type === 'pointerenter') {
      const setting = getSetting()
      if (setting.whiteboard.onlyEraseFreeDraw) {
        if (node.type === 'freehand') {
          flow.erasedNodeIds.add(node.id)
          setIsTouched(true)
        }

        return
      }
      flow.erasedNodeIds.add(node.id)
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

export default useEraseNode
