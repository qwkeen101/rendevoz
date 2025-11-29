import { selectAtom } from 'jotai/utils'
import { GlobalSetting } from '@/core'
import { isEqual } from 'lodash'
import { useDebounceFn, useGlobalAtomValue, useUpdateEffect } from '@/hooks'
import useGraph from '@/core/components/graph/hooks/useGraph'

const selectedAtom = selectAtom(
  GlobalSetting.settingAtom,
  s => ({
    nodeSize: s.graph.nodeSize,
    nodeDistance: s.graph.nodeDistance
  }),
  isEqual
)
export default () => {
  const graph = useGraph()
  const { nodeDistance, nodeSize } = useGlobalAtomValue(selectedAtom)
  const debounceUpdateLayout = useDebounceFn(
    () => {
      graph.size = nodeSize
      graph.distance = nodeDistance
      graph.updateLayout()
    },
    { wait: 1000 }
  )
  useUpdateEffect(() => {}, [nodeSize, nodeDistance])
}
