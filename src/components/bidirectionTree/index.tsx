import { metaObjectsAtom, undeletedMetaLinksAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores/stores'
import * as d3 from 'd3'
import { Provider, useAtomValue } from 'jotai/react'
import { createStore } from 'jotai/vanilla'
import createPanZoom, { PanZoom } from 'panzoom'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MetaLink, MetaObject } from '~/typings/data'
import TreeEdgeContainer from './EdgeContainer'
import FlowManager from './FlowManager'
import { FlowAtom, useFlow, useSetTreeEdges, useSetTreeNodes } from './hooks'
import TreeNodeContainer from './NodeContainer'
import { ITreeEdge, ITreeNode } from './types'

const BidirectionObjectsTreeInner = ({ centerNodeId }: { centerNodeId: number }) => {
  const undeletedLinks = useAtomValue(undeletedMetaLinksAtom, { store: globalStore })
  const allMetaObjects = useAtomValue(metaObjectsAtom, { store: globalStore })
  const setEdges = useSetTreeEdges()
  const setNodes = useSetTreeNodes()
  const containerRef = useRef(null)
  const flow = useFlow()
  const panzoomRef = useRef<PanZoom>()
  useLayoutEffect(() => {
    if (flow && containerRef.current) {
      flow.containerEle = containerRef.current
      const panzoom = createPanZoom(containerRef.current, {
        smoothScroll: false,
        beforeMouseDown: e => {
          if (!(e.target as HTMLElement).hasAttribute('role')) return true
          if ((e.target as HTMLElement).hasAttribute('role')) {
            const role = (e.target as HTMLElement).getAttribute('role')
            if (role === 'modal' || role === 'data-container') return false
            return true
          }
          if (e.defaultPrevented) {
            return true
          } else {
            return false
          }
        },
        beforeWheel: e => {
          if (e.defaultPrevented) {
            return true
          } else {
            return false
          }
        }
      })
      panzoomRef.current = panzoom
      panzoom.on('zoom', e => {
        const { scale } = panzoom.getTransform()
        flow.containerTransformScale = scale
      })
      return () => {
        panzoom.dispose()
      }
    }
  }, [])
  const [svgContainerState, setSvgContainerState] = useState<{
    width: number
    height: number
    viewBox?: string
  }>({
    width: window.innerWidth * 0.9,
    height: window.innerHeight * 0.9
  })

  const { width, height } = svgContainerState
  useEffect(() => {
    if (!allMetaObjects.has(centerNodeId)) return
    const targetToSelfLinks: MetaLink[] = []
    const selfToTargetLinks: MetaLink[] = []
    const stToIdMap = new Map<string, number>()
    undeletedLinks.forEach(link => {
      stToIdMap.set(`${link.sourceId}_${link.targetId}`, link.id)
      if (link.targetId === centerNodeId) {
        allMetaObjects.has(link.sourceId) && targetToSelfLinks.push(link)
      }
      if (link.sourceId === centerNodeId) {
        allMetaObjects.has(link.targetId) && selfToTargetLinks.push(link)
      }
    })

    const leftObjects = targetToSelfLinks.map(i => allMetaObjects.get(i.sourceId)) as MetaObject[]
    const centerObject = allMetaObjects.get(centerNodeId)!
    const rightObjects = selfToTargetLinks.map(i => allMetaObjects.get(i.targetId)) as MetaObject[]
    if (!leftObjects.some(i => i === centerObject)) leftObjects.push(centerObject)
    if (!rightObjects.some(i => i === centerObject)) rightObjects.push(centerObject)

    const left = d3
      .stratify()
      .id(d => String(d.id))
      .parentId(d => (d.id === centerNodeId ? '' : String(centerNodeId)))(leftObjects)
    const right = d3
      .stratify()
      .id(d => String(d.id))
      .parentId(d => (d.id === centerNodeId ? '' : String(centerNodeId)))(rightObjects)
    const leftTreeData = d3.hierarchy(left)
    const rightTreeData = d3.hierarchy(right)

    // const leftTree = d3.tree().size([height, (-1 * (width - 150)) / 2])
    const leftTree = d3.tree().nodeSize([100, -600])
    const rightTree = d3.tree().nodeSize([100, 600])
    // const rightTree = d3.tree().size([height, (width - 150) / 2])

    leftTree(leftTreeData)
    rightTree(rightTreeData)

    const leftTreeLinks = leftTreeData.links()
    const rightTreeLinks = rightTreeData.links()
    const leftTreeNodes = leftTreeData.descendants()
    const rightTreeNodes = rightTreeData.descendants()

    const aggregatedNodes = [...leftTreeNodes, ...rightTreeNodes].map(node => {
      const { x, y } = node
      const id = Number(node.data.data.id)
      return {
        x: y + 200,
        y: x,
        id
      } as ITreeNode
    })
    panzoomRef.current?.moveBy(width * 0.25, height * 0.5, false)
    setNodes(new Map(aggregatedNodes.map(i => [i.id, i])))
    const leftEdges = leftTreeLinks.map(link => {
      const sourceId = Number(link.target.data.data.id)
      const targetId = Number(link.source.data.data.id)
      const linkId = stToIdMap.get(`${sourceId}_${targetId}`)
      return {
        id: linkId,
        sourceId,
        targetId
      } as ITreeEdge
    })
    const rightEdges = rightTreeLinks.map(link => {
      const sourceId = Number(link.source.data.data.id)
      const targetId = Number(link.target.data.data.id)
      const linkId = stToIdMap.get(`${sourceId}_${targetId}`)
      return {
        id: linkId,
        sourceId,
        targetId
      } as ITreeEdge
    })
    setEdges(new Map([...leftEdges, ...rightEdges].map(i => [i.id, i])))
  }, [centerNodeId])

  return (
    <div
      ref={containerRef}
      role="data-container"
      style={{
        position: 'relative',
        width: svgContainerState.width,
        height: svgContainerState.height,
        background: 'transparent'
      }}
    >
      <TreeNodeContainer />
      <TreeEdgeContainer />
    </div>
  )
}

const BidirectionObjectsTree = ({ centerNodeId }: { centerNodeId: number }) => {
  const flowManager = useMemo(() => new FlowManager(), [])
  const store = useMemo(() => createStore(), [])
  store.set(FlowAtom, flowManager)
  return (
    <Provider store={store}>
      <BidirectionObjectsTreeInner centerNodeId={centerNodeId} />
    </Provider>
  )
}
export default BidirectionObjectsTree
