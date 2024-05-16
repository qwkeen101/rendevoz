import { Content } from '@/components/base'
import { useDebounceFn } from '@/hooks'
import { useSetAtom } from 'jotai'
import { GraphFilterNodesIdsAtom } from '../hooks/useGraphFilter'
import useGraphNodes from '../hooks/useGraphNodes'
import BetterFilter from '@/core/object/filter/BetterFilter'
import { MetaFilterGroup } from '~/typings'
import { calculateFilterObjects } from '@/core/object/filter/useBetterFilter'
const GraphFilter = () => {
  const [nodes, setNodes] = useGraphNodes()
  const setGraphFilterIds = useSetAtom(GraphFilterNodesIdsAtom)

  const handleDebounceFilter = useDebounceFn(
    async (filterGroup: MetaFilterGroup) => {
      const currentObjects = nodes?.map(i => i.id)
      const filtered = await calculateFilterObjects(filterGroup, currentObjects)

      setGraphFilterIds(filtered?.map(i => i.id) || [])
    },
    { wait: 500 }
  )
  return (
    <Content flex column fullHeight style={{ minWidth: 250 }}>
      <BetterFilter
        onChange={v => {
          handleDebounceFilter.run(v)
        }}
      />
    </Content>
  )
}

export default GraphFilter
