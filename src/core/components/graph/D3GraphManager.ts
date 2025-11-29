import * as d3 from 'd3'
import { GraphNode } from './types/node'
import { GraphEdge } from './types/edge'
import { GraphOverlayManager } from './components/overlay/useGraphOverlay'
import produce from 'immer'
import { Viewport } from 'pixi-viewport'
import { Container, DisplayObject } from 'pixi.js'
import { GlobalSetting } from '@/core'
import { waitFor } from '@/utils'
import { getBoxOfBoxes } from '@/core/components/whiteboard/utils'

class D3GraphManager {
  public sidePeek?: (metaId: number) => void
  public isChoosingNode: false | 'start' | 'end' = false
  public container: d3.Selection<HTMLElement, unknown, null, any> | null = null
  public d3Simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null
  public isDragging = false
  public contextMenuNode: GraphNode | null = null
  public size: number
  public distance: number
  public onGetData: () => {
    nodes: GraphNode[]
    edges: GraphEdge[]
  }
  private onChange: (data: { nodes?: GraphNode[]; edges?: GraphEdge[] }) => void
  public nodesMap: Map<number, GraphNode> | null = null
  public pixiViewport?: Viewport
  public centerNodeId?: number
  public type: 'canvas' | 'svg' = 'canvas'
  // edge to edge map
  public oppositeEdgesMap = new Map<number, GraphEdge>()
  public CACHED_ICON_TEXTURE = new Map<string, any>()
  public CACHED_ICON_DATA_URL = new Map<string, string>()
  public ID_TO_PIXI_NODE_MAP = new Map<number, Container<DisplayObject>>()
  public ID_TO_PIXI_EDGE_MAP = new Map<number, Container<DisplayObject>>()
  public isAddingEdge = false
  public newAddedEdge: GraphEdge | null = null
  public overlayManager?: GraphOverlayManager
  public currentClickNodeId?: number
  public currentClickEdgeId?: number
  public ID_TO_EDGE_FUNCTION_MAP = new Map<
    number,
    {
      drawEdge: VoidFunction
      hideLabel: VoidFunction
      unhidenLabel: VoidFunction
    }
  >()
  constructor(
    onGetData: () => {
      nodes: GraphNode[]
      edges: GraphEdge[]
    },
    onChange: (data: { nodes?: GraphNode[]; edges?: GraphEdge[] }) => void
  ) {
    const graphSetting = GlobalSetting.getSetting().graph
    this.size = graphSetting.nodeSize
    this.distance = graphSetting.nodeDistance
    this.onGetData = onGetData
    this.onChange = onChange
  }
  public getRadius = () => {
    const radius = this.size + this.distance / 2 + 20
    return radius
  }
  public clear = () => {
    this.d3Simulation = null
    this.moved = false
    this.ID_TO_PIXI_NODE_MAP.clear()
    this.ID_TO_EDGE_FUNCTION_MAP.clear()
    this.ID_TO_PIXI_EDGE_MAP.clear()
  }
  public slightRestartSimu = () => {
    const { nodes, edges } = this.onGetData()
    this.d3Simulation
      ?.nodes(nodes)
      .force(
        'link',
        d3
          .forceLink(edges)
          .id(d => d.id)
          .distance(this.distance)
      )
      .alphaTarget(0.5)
      .restart()
  }

  public registerNewAddedEdge = (edge: GraphEdge | null) => {
    this.newAddedEdge = edge
  }
  public updateLayout = (reheat?: boolean, reinitialize?: boolean) => {
    this.simulateLayout(reheat, reinitialize)
  }
  public moved = false
  private simulateLayout = (reheat?: boolean, reinitialize?: boolean) => {
    const { nodes, edges } = this.onGetData()
    if (nodes.length === 0) return
    if (this.d3Simulation && !reinitialize) {
      this.d3Simulation.stop()
      this.d3Simulation
        .nodes(nodes)
        .force(
          'link',
          d3
            .forceLink(edges)
            .id(d => d.id)
            .distance(this.distance)
        )
        .force('collide', d3.forceCollide(this.getRadius()))
        .alpha(reheat ? 1 : 0)
        .restart()
      return
    }
    const forceNode = d3.forceManyBody().strength(50)
    const forceLink = d3
      .forceLink(edges)
      .id(d => d.id)
      .distance(this.distance)

    this.d3Simulation = d3
      .forceSimulation(nodes)
      .force('link', forceLink)
      .force('charge', forceNode)
      .force('center', d3.forceCenter())
      .force('collide', d3.forceCollide(this.getRadius()))
      .tick(300)
      .on('tick', this.ticked)
      .on('end', () => {
        if (!this.moved) {
          this.fitCenter()
          this.moved = true
        }
        const d3Nodes = new Map((this.d3Simulation?.nodes() || []).map(i => [i.id, i]))
        // change x and y after tick
        this.onChange({
          nodes: produce(this.onGetData().nodes, draft => {
            draft.forEach(n => {
              const d3Node = d3Nodes.get(n.id)
              if (d3Node) {
                n.x = d3Node.x
                n.y = d3Node.y
                n.z = d3Node.z
              }
            })
          })
        })
        edges.forEach(e => {
          waitFor(
            () => !!this.ID_TO_EDGE_FUNCTION_MAP.get(e.id),
            () => {
              this.ID_TO_EDGE_FUNCTION_MAP.get(e.id)?.drawEdge()
            }
          )
        })
      })
  }
  public fitCenter = () => {
    const { nodes } = this.onGetData()
    const viewport = this.pixiViewport
    if (viewport) {
      const box = getBoxOfBoxes(
        nodes.map(i => ({
          left: i.x!,
          top: i.y!,
          width: this.size * 2,
          height: this.size * 2
        }))
      )
      if (box) {
        viewport.fit(false, box.width + 200, box.height + 200)
        viewport.moveCenter(box.left + box.width / 2, box.top + box.height / 2)
      }
    }
  }
  public ticked = () => {
    const d3Nodes = new Map((this.d3Simulation?.nodes() || []).map(i => [i.id, i]))
    const { nodes, edges } = this.onGetData()
    this.onChange({
      nodes: produce(nodes, draft => {
        draft.forEach(node => {
          const d3Node = d3Nodes.get(node.id)
          if (d3Node) {
            node.x = d3Node.x
            node.y = d3Node.y
            node.z = d3Node.z
          }
        })
      })
    })
    edges.forEach(e => {
      waitFor(
        () => !!this.ID_TO_EDGE_FUNCTION_MAP.get(e.id),
        () => {
          this.ID_TO_EDGE_FUNCTION_MAP.get(e.id)?.drawEdge()
        }
      )
    })
  }
  public getRelatedNodesAndEdges = (sourceNode: GraphNode) => {
    const { nodes, edges } = this.onGetData()
    const sourceToTargetEdges = edges.filter(i => i.source?.id === sourceNode.id) || []
    const targetToSourceEdges = edges.filter(i => i.target?.id === sourceNode.id) || []
    const sourceToTargetNodes = nodes.filter(i => sourceToTargetEdges?.some(o => o.target?.id === i.id)) || []
    const targetToSourceNodes = nodes.filter(i => targetToSourceEdges?.some(o => o.source?.id === i.id)) || []
    return {
      sourceToTargetEdges,
      targetToSourceNodes,
      targetToSourceEdges,
      sourceToTargetNodes
    }
  }
}

export default D3GraphManager
