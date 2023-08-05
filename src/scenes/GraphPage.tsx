import { Content, Icon } from '@/components'
import { TabTitle } from '@/core/rendevoz/components'
import GraphContainer from '@/core/graph/components/GraphContainer'
import { useEffect, useState } from 'react'
import { globalStore } from '@/stores'
import { metaObjectsAtom } from '@/stores/meta.store'
import { getAllEdgesOfNodes } from '@/core'
import { GraphEdge } from '@/core/graph/types/edge'
import { GraphNode } from '@/core/graph/types/node'
import { atom } from 'jotai'
import { useGlobalAtom } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { renderPageInNormalMode } from '@/core/pdf/core/utils/renderer'

export const GlobalGraphAtom = atom<
  | {
      nodes: GraphNode[]
      edges: GraphEdge[]
    }
  | undefined
>(undefined)
const GraphPage = () => {
  const [globalGraph, setGlobalGraph] = useGlobalAtom(GlobalGraphAtom)
  const { t } = useTranslation()
  renderPageInNormalMode()
  useEffect(() => {
    if (!globalGraph) {
      const allNodes = Array.from(globalStore.get(metaObjectsAtom).values()).map(i => ({
        id: i.id,
        label: i.name,
        coverImgSrc: i.coverImgSrc,
        type: i.type,
        icon: i.icon,
        objectId: i.objectId
      }))
      const edgez = getAllEdgesOfNodes(new Set(allNodes.map(i => i.id)))
      setGlobalGraph({
        edges: edgez,
        nodes: allNodes
      })
    }
    return () => {
      setGlobalGraph(undefined)
    }
  }, [])
  return (
    <Content fullWidth fullHeight>
      <TabTitle icon={<Icon name={'park-share-one'} size={16} />} title={t('general.graph view')} />
      {globalGraph && <GraphContainer edges={globalGraph.edges} nodes={globalGraph.nodes} />}
    </Content>
  )
}

export default GraphPage
