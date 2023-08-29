import { Content, Icon, WithBorder } from '@/components/base'
import { DatabaseFilter, FilterNameSearchAtom, SimpleObject } from '@/core'
import { useDebounceFn, useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useVirtualizer } from '@tanstack/react-virtual'
import produce from 'immer'
import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Rnd } from 'react-rnd'
import { GlobalGraphInstance } from '..'
import useGraph from '../hooks/useGraph'
import { GraphFilterNodesIdsAtom, GraphPinNodesIdsAtom, GraphVisibleNodesIdsAtom } from '../hooks/useGraphFilter'
import useGraphNodes, { GraphNodesAtom } from '../hooks/useGraphNodes'
import { Colors } from '@/consts'
import BetterFilter from '@/core/database/filter/BetterFilter'
import { MetaFilterGroup, MetaObject } from '~/typings'
import { calculateFilterObjects } from '@/core/database/filter/useBetterFilter'
import { MetaStore } from '@/stores'

const graphFilterTitleClassName = css({
  cursor: 'grab',
  fontFamily: 'Muli',
  padding: '4px 12px'
})
const GraphFilter = () => {
  const { t } = useTranslation()
  const [nodes, setNodes] = useGraphNodes()
  const graphVisibleNodesIds = useAtomValue(GraphVisibleNodesIdsAtom)
  const [pinnedNodesIds, setPinnedNodesIds] = useAtom(GraphPinNodesIdsAtom)
  const setGraphFilterIds = useSetAtom(GraphFilterNodesIdsAtom)
  const store = useStore()
  const graph = useGraph()

  const handleFocus = (nodeId: number) => {
    const graphNodes = store.get(GraphNodesAtom)
    if (graphNodes && graph) {
      const targetNode = graphNodes.find(n => n.id === nodeId)
      if (targetNode) {
        graph.moveToNode(targetNode.id)
        setNodes(nodes =>
          nodes
            ? produce(nodes, draft => {
                nodes?.forEach((n, idx) => {
                  if (n.isCenter && n.id !== nodeId) {
                    draft[idx].isCenter = false
                  }
                  if (n.id === nodeId) {
                    draft[idx].isCenter = true
                  }
                })
              })
            : nodes
        )
      }
    }
  }

  const handleHighlightRelated = (nodeId: number) => {
    if (pinnedNodesIds.has(nodeId)) {
      setPinnedNodesIds(ns =>
        produce(ns, draft => {
          draft.delete(nodeId)
        })
      )
    } else {
      setPinnedNodesIds(ns =>
        produce(ns, draft => {
          draft.add(nodeId)
        })
      )
    }
  }

  const handleDebounceFilter = useDebounceFn(
    (filterGroup: MetaFilterGroup) => {
      const currentObjects = nodes?.map(i => i.id)
      const filtered = calculateFilterObjects(filterGroup, currentObjects)
      if (filtered) {
        setGraphFilterIds(filtered.map(i => i.id))
      }
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
