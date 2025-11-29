import { Content, Icon, TabTitle } from '@/components'
import GraphContainer from '@/core/components/graph/components/GraphContainer'
import { useLayoutEffect } from 'react'
import { globalStore, MetaStore } from '@/api/stores'
import { metaObjectsAtom } from '@/api/stores/meta/meta.store'
import { GlobalSetting, traverseGetRelatedNodeIds } from '@/core'
import { GraphEdge } from '@/core/components/graph/types/edge'
import { GraphNode } from '@/core/components/graph/types/node'
import { atom } from 'jotai'
import { useDebounceEffect, useGlobalAtom, useSelectAtomValue } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { renderPageInNormalMode } from '@/core/components/pdf/core/utils/renderer'
import { MetaObject } from '~/typings'

export const GlobalGraphAtom = atom<
  | ({
      nodes: GraphNode[]
      edges: GraphEdge[]
    } & (
      | {
          mode: 'all'
        }
      | {
          mode: 'object'
          id: number
        }
    ))
  | undefined
>(undefined)
const GraphPage = () => {
  const [globalGraph, setGlobalGraph] = useGlobalAtom(GlobalGraphAtom)
  const { t } = useTranslation()
  const allObjects = MetaStore.useMetaObjectsMap()
  const allLinks = MetaStore.useMetaLinksMap()
  const { showHidden, showHighlight } = useSelectAtomValue(GlobalSetting.settingAtom, s => ({
    showHidden: s.graph.showHidden,
    showHighlight: s.graph.showHighlight
  }))
  renderPageInNormalMode()
  const calculateGraph = () => {
    const metaObjectsMap = MetaStore.getMetaObjectsMap()
    const allMetaLinks = Array.from(MetaStore.getMetaLinksMap().values())
    const nodeIds = new Set<number>()
    if (globalGraph?.mode === 'object') {
      nodeIds.add(globalGraph.id)
      traverseGetRelatedNodeIds(globalGraph.id, nodeIds, false)
    } else {
      const allNodes = Array.from(globalStore.get(metaObjectsAtom).values())
      allNodes.forEach(i => nodeIds.add(i.id))
    }
    nodeIds.forEach(n => {
      const isVisible = MetaStore.isVisibleMetaObject(
        n,
        globalGraph?.mode === 'object'
          ? { showHidden: true, showLabel: true, showTemp: true }
          : {
              showHidden: showHidden,
              showLabel: showHighlight
            }
      )
      if (!isVisible) {
        nodeIds.delete(n)
      }
    })
    const nodes = (Array.from(nodeIds.values()).map(nodeId => metaObjectsMap.get(nodeId)) as MetaObject[]).map(i => ({
      id: i.id,
      label: i.name,
      coverImgSrc: i.coverImgSrc,
      type: i.type,
      isCenter: globalGraph?.mode === 'object' && i.id === globalGraph.id,
      icon: i.icon,
      objectId: i.objectId
    }))
    const edges = allMetaLinks
      .filter(i => nodeIds.has(i.sourceId) && nodeIds.has(i.targetId))
      .map(i => ({ ...i, source: i.sourceId, target: i.targetId }))
    setGlobalGraph(s => ({ ...s, edges, nodes }))
  }
  useLayoutEffect(() => {
    calculateGraph()
  }, [showHidden, showHighlight])
  useDebounceEffect(
    () => {
      calculateGraph()
    },
    [allObjects, allLinks],
    { wait: 500 }
  )
  return (
    <Content fullWidth fullHeight>
      <TabTitle icon={<Icon name={'park-share-one'} size={16} />} title={t('general.graph')} />
      {globalGraph && <GraphContainer edges={globalGraph.edges} nodes={globalGraph.nodes} />}
    </Content>
  )
}

export default GraphPage
