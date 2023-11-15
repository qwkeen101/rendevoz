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
import BetterFilter from '@/core/object/filter/BetterFilter'
import { MetaFilterGroup, MetaObject } from '~/typings'
import { calculateFilterObjects } from '@/core/object/filter/useBetterFilter'
import { MetaStore } from '@/api/stores'
const GraphFilter = () => {
  const [nodes, setNodes] = useGraphNodes()
  const setGraphFilterIds = useSetAtom(GraphFilterNodesIdsAtom)

  const handleDebounceFilter = useDebounceFn(
    (filterGroup: MetaFilterGroup) => {
      const currentObjects = nodes?.map(i => i.id)
      const filtered = calculateFilterObjects(filterGroup, currentObjects)

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
