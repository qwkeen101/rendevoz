import { Content, Icon, Panel } from '@/components/base'
import { setNode } from '@/components/editor/yjs/applyToYjs/node/setNode'
import { Tag } from '@/components/form/EditMetaObjectForm'
import { relatedMetaObjectsMapAtom, tagToMetaObjectIdsMapAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import produce from 'immer'
import { useAtomValue } from 'jotai/react'
import { useEffect, useMemo, useState } from 'react'
import useEdges from '../../hooks/useEdges'
import useGraph from '../../hooks/useGraph'
import useNodes from '../../hooks/useNodes'
import useTags from '../../hooks/useTags'
import { NodeFakeHiddenOpacity } from '../NodeContainer'

const GraphFilter = () => {
  const [nodes, setNodes] = useNodes()
  const [edges, setEdges] = useEdges()
  const relatedObjectsMap = useAtomValue(relatedMetaObjectsMapAtom, { store: globalStore })
  const graph = useGraph()
  const allTags = useMemo(() => {
    const set = new Set<string>()
    nodes?.forEach(i => i.tags?.forEach(tag => set.add(tag)))
    return Array.from(set)
  }, [nodes])
  const tagToMetaObjectsMap = useAtomValue(tagToMetaObjectIdsMapAtom, { store: globalStore })
  const [selectedTags, setSelectedTags] = useTags()
  const toggleNodeVisibility = (nodeId: number) => {
    if (!nodes) return
    const idx = nodes?.findIndex(i => i.id === nodeId)
    if (idx < 0) return
    const node = nodes[idx]
    if (!node || !nodes || !edges) return
    const nextState = !node.hidden
    const newNodes = produce(nodes, draft => {
      draft[idx].hidden = nextState
    })
    const graphNode = graph?.nodesMap?.get(nodeId)
    graphNode && (graphNode.hidden = nextState)
    setNodes(newNodes)
    const hiddenNodesIds = new Set<number>()
    newNodes.forEach(n => {
      if (n.hidden) hiddenNodesIds.add(n.id)
    })
    const newEdges = produce(edges, draft => {
      edges.forEach((i, idx) => {
        if (i.sourceId === nodeId || i.targetId === nodeId) {
          if (nextState === true) {
            draft[idx].hidden = nextState
            const graphEdge = graph?.edgesMap?.get(i.id)
            graphEdge && (graphEdge.hidden = nextState)
          }
          if (nextState === false) {
            if (!hiddenNodesIds.has(i.sourceId) && !hiddenNodesIds.has(i.targetId)) {
              console.log(i)
              draft[idx].hidden = nextState
              const graphEdge = graph?.edgesMap?.get(i.id)
              graphEdge && (graphEdge.hidden = nextState)
            }
          }
        }
      })
    })
    setEdges(newEdges)
    graph?.updateLayout()
  }
  const toggleTag = (tag: string) => {
    const hasTag = selectedTags.some(i => i === tag)
    if (hasTag) {
      const idx = selectedTags.findIndex(i => i === tag)
      setSelectedTags(
        produce(selectedTags, draft => {
          draft.splice(idx, 1)
        })
      )
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  useEffect(() => {
    if (!nodes || !edges) return

    if (selectedTags.length > 0) {
      const tagToObjects = selectedTags.map(tag => ({
        tag,
        objects: tagToMetaObjectsMap.get(tag)
      }))
      const hasTagObjectIds = new Set<number>()
      tagToObjects.forEach(i => {
        i.objects?.forEach(o => hasTagObjectIds.add(o))
      })
      const newNodes = produce(nodes, draft => {
        nodes.forEach((n, idx) => {
          if (!hasTagObjectIds.has(n.id)) {
            draft[idx].opacity = NodeFakeHiddenOpacity
          } else {
            draft[idx].opacity = 1
          }
        })
      })
      const newEdges = produce(edges, draft => {
        edges.forEach((e, idx) => {
          if (!(hasTagObjectIds.has(e.sourceId) && hasTagObjectIds.has(e.targetId))) {
            draft[idx].opacity = NodeFakeHiddenOpacity
          } else {
            draft[idx].opacity = 1
          }
        })
      })
      setNodes(newNodes)
      setEdges(newEdges)
    } else {
      const newNodes = produce(nodes, draft => {
        nodes.forEach((n, idx) => {
          if (n.opacity === NodeFakeHiddenOpacity) {
            draft[idx].opacity = 1
          }
        })
      })
      const newEdges = produce(edges, draft => {
        edges.forEach((e, idx) => {
          if (e.opacity === NodeFakeHiddenOpacity) {
            draft[idx].opacity = 1
          }
        })
      })
      setNodes(newNodes)
      setEdges(newEdges)
    }
  }, [selectedTags])
  return (
    <Content flex column style={{ width: 300, maxHeight: 600, overflowY: 'auto' }}>
      <Panel defaultVisible={false} title="Toggle Nodes Visibility">
        {nodes?.map(i => (
          <Content flex alignItems="center" gap={6}>
            <Icon
              className={ClassName.circleButton()}
              onClick={() => toggleNodeVisibility(i.id)}
              name={!i.hidden ? 'park-preview-open' : 'park-preview-close'}
            />
            <span>{i.label}</span>
          </Content>
        ))}
      </Panel>
      <Panel defaultVisible={false} title="Filter By Tags">
        <Content flex column gap={6} style={{ marginTop: 6 }}>
          {allTags?.map(i => (
            <Content flex gap={6}>
              <Icon
                onClick={() => toggleTag(i)}
                fill={selectedTags.some(o => o === i) ? '#FFD56F' : undefined}
                theme={selectedTags.some(o => o === i) ? 'filled' : undefined}
                className={ClassName.circleButton()}
                name="park-star"
              />
              <Tag small hideDelete hideSize tag={i} key={i} />
            </Content>
          ))}
        </Content>
      </Panel>
    </Content>
  )
}

export default GraphFilter
