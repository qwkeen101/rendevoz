import * as d3 from 'd3'
import { GraphNode } from './types/node'
import { GraphEdge } from './types/edge'
import { curveBasis } from 'd3'
import { getMarkerId } from './utils/getMarkerId'
import { MarkerColor } from './consts/markerColors'
import { GraphOverlayManager } from './components/overlay/useGraphOverlay'
import { TypeToNodeRadius } from './components/node/Node'

class D3GraphManager {
  private container: d3.Selection<HTMLElement, unknown, null, any> | null = null
  private transform = null
  public d3Simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null
  public isDragging = false
  public contextMenuNode: GraphNode | null = null
  public currentHoverNode: GraphNode | null = null
  public originNodes: any[] | null = null
  public originEdges: any[] | null = null
  public nodesMap: Map<number, GraphNode> | null = null
  private edgesMap: Map<number, GraphEdge> | null = null
  private linkStartPoint = null
  // edge to edge map
  public oppositeEdgesMap = new Map<number, GraphEdge>()
  public isAddingEdge = false
  public newAddedEdge: GraphEdge | null = null
  private changeHandlerSet: Set<(nodes: GraphNode[], edges: GraphEdge[]) => void> = new Set()
  private zoomHandlerSet: Set<(transform: any) => void> = new Set()
  public overlayManager?: GraphOverlayManager
  private ID_TO_NODE_ELEMENT_MAP = new Map<number, SVGElement>()
  private ID_TO_EDGE_ELEMENT_MAP = new Map<number, SVGElement>()
  private ID_TO_EDGE_LABEL_ELEMENT_MAP = new Map<number, SVGElement>()
  private getRadius = (type: string) => {
    console.log(type)
    switch (type) {
      case 'note':
      case 'pdf':
        return 300
      default:
        return 150
    }
  }
  public registerHandler = (name: string, handler: any) => {
    if (name === 'change') {
      this.changeHandlerSet.add(handler)
    }
    if (name === 'zoom') {
      this.zoomHandlerSet.add(handler)
    }
  }

  // outer container
  public registerContainer = (container: HTMLElement) => {
    this.container = d3.select(container)
    const zoom = d3.zoom().scaleExtent([0.1, 5]).on('zoom', this.zoomed)
    this.container?.call(zoom).on('dblclick.zoom', null)
    this.container?.on('mousemove', this.globalMousemoveHandler)
    this.container.selectChild('#viewport').on('click', this.globalClickHandler)
  }
  public clear = () => {
    this.originEdges = null
    this.originNodes = null
    this.d3Simulation = null
    // this.ID_TO_EDGE_ELEMENT_MAP.clear()
    // this.ID_TO_NODE_ELEMENT_MAP.clear()
    // this.ID_TO_EDGE_LABEL_ELEMENT_MAP.clear()
  }
  public registerNodes = (nodes: GraphNode[]) => {
    if (this.originNodes) {
      nodes.forEach(n => {
        // this.N.push(n.id)
        this.originNodes?.push({ id: n.id, type: n.type })
      })
      this.updateLayout()
    } else {
      // in originNodes we just need id, no other properties.
      this.originNodes = nodes.map(n => ({ id: n.id, type: n.type }))
    }
    this.nodesMap = new Map(this.originNodes.map(n => [n.id, n]))
    const clonedNodes = structuredClone(this.originNodes)
    return clonedNodes
  }

  public registerEdges = (edges: GraphEdge[]) => {
    if (this.originEdges) {
      edges.forEach(e => {
        this.originEdges?.push({
          source: e.sourceId,
          sourceId: e.sourceId,
          target: e.targetId,
          targetId: e.targetId,
          id: e.id
        })
      })
      this.updateLayout()
    } else {
      this.originEdges = d3.map(edges, e => ({
        source: e.sourceId,
        sourceId: e.sourceId,
        target: e.targetId,
        targetId: e.targetId,
        id: e.id
      }))
    }
    const clonedEdges = structuredClone(this.originEdges)
    return clonedEdges
  }
  public deleteNodes = (nodes: GraphNode[]) => {
    if (this.originNodes) {
      this.originNodes = this.originNodes?.filter(n => !nodes.some(o => o.id === n.id))
      nodes.forEach(n => {
        // delete related edges for each node
        const { sourceToTargetEdges, targetToSourceEdges } = this.getRelatedNodesAndEdges(n)
        this.originEdges = this.originEdges?.filter(
          e => !(sourceToTargetEdges.some(i => i.id === e.id) || targetToSourceEdges.some(i => i.id === e.id))
        )
        const clonedNodes = structuredClone(this.originNodes)
        const clonedEdges = structuredClone(this.originEdges)
        this.changeHandlerSet.forEach(handler => handler(clonedNodes, clonedEdges))
      })

      // this.updateLayout()
    }
  }
  public deleteEdges = (edges: GraphEdge[]) => {}

  public registerEdgeElement = (edgeId: number, edgeElement: SVGElement) => {
    this.ID_TO_EDGE_ELEMENT_MAP.set(edgeId, edgeElement)
  }

  public registerNodeElement = (nodeId: number, nodeElement: SVGElement) => {
    this.ID_TO_NODE_ELEMENT_MAP.set(nodeId, nodeElement)
  }
  public registerLabelElement = (edgeId: number, labelElement: SVGElement) => {
    this.ID_TO_EDGE_LABEL_ELEMENT_MAP.set(edgeId, labelElement)
  }
  public registerNewAddedEdge = (edge: GraphEdge | null) => {
    this.newAddedEdge = edge
  }
  public updateLayout = (reheat?: boolean, reinitialize?: boolean) => {
    this.simulateLayout(reheat, reinitialize)
  }
  private simulateLayout = (reheat?: boolean, reinitialize?: boolean) => {
    if (this.originNodes?.length === 0 || !this.originNodes) return
    if (this.d3Simulation && !reinitialize) {
      this.d3Simulation
        .nodes(this.originNodes)
        .force(
          'link',
          d3
            .forceLink(this.originEdges)
            .id(d => d.id)
            .distance(300)
        )
        .force(
          'collision',
          d3.forceCollide().radius(n => this.getRadius(n.type))
        )
        .alpha(reheat ? 0.8 : 0)
        .alphaTarget(0)
        .on('tick', this.ticked)
        .restart()
      return
    }
    if (this.originEdges && this.originNodes) {
      const forceNode = d3.forceManyBody()
      const forceLink = d3
        .forceLink(this.originEdges)
        .id(d => d.id)
        .distance(300)
      this.d3Simulation = d3
        .forceSimulation(this.originNodes)
        .force('link', forceLink)
        .force('charge', forceNode)
        .force('center', d3.forceCenter())
        .force(
          'collision',
          d3.forceCollide().radius(n => this.getRadius(n.type))
        )
        // .stop()
        .tick(300)
        .on('tick', this.ticked)
        .on('end', () => {
          const clonedNodes = structuredClone(this.originNodes)
          const clonedEdges = structuredClone(this.originEdges)
          this.ID_TO_EDGE_LABEL_ELEMENT_MAP.forEach(i => i.removeAttribute('opacity'))
          this.changeHandlerSet.forEach(handler => handler?.(clonedNodes, clonedEdges))
        })
    }
  }

  public startAddEdge = (sourceNode: SVGGElement) => {
    const bounding = (
      sourceNode.querySelector('image') ||
      sourceNode.querySelector('circle') ||
      sourceNode.querySelector('foreignObject')
    ).getBoundingClientRect()
    const viewportBounding = document.getElementById('viewport')?.getBoundingClientRect()
    this.linkStartPoint = {
      x: Number(String((bounding.x + 20 - viewportBounding?.x) / (this.transform?.k || 1))),
      y: Number(String((bounding.y + 20 - viewportBounding?.y) / (this.transform?.k || 1)))
    }
  }
  public endAddEdge = () => {
    this.isAddingEdge = false
    d3.select('#addLinkLine')
      .attr('opacity', 1)
      .transition()
      .duration(200)
      .attr('opacity', 0)
      .on('end', () => {
        d3.select('#addLinkLine').attr('d', null).attr('opacity', 1)
      })
  }

  private ticked = () => {
    this.d3Simulation?.tick(5)
    if (this.originEdges && this.originNodes) {
      this.originEdges.forEach(edge => {
        const path = this.drawEdge(edge, edge.source.x, edge.source.y, edge.target.x, edge.target.y)
        this.ID_TO_EDGE_ELEMENT_MAP.get(edge.id)?.setAttribute('d', path)
        this.ID_TO_EDGE_LABEL_ELEMENT_MAP.get(edge.id)?.setAttribute('opacity', '0')
      })
      this.originNodes.forEach(node => {
        this.ID_TO_NODE_ELEMENT_MAP.get(node.id)?.setAttribute('transform', `translate(${node.x},${node.y})`)
      })
    }
  }
  private zoomed = event => {
    this.transform = event.transform
    this.zoomHandlerSet.forEach(handler => handler?.(event.transform))
  }
  private globalMousemoveHandler = (e: MouseEvent) => {
    if (this.isAddingEdge) {
      const curve = d3.line().curve(curveBasis)
      const [startX, startY] = [this.linkStartPoint.x, this.linkStartPoint.y]
      const [endX, endY] = d3.pointer(e, document.getElementById('viewport'))
      const [realEndX, realEndY] = [endX / (this.transform?.k || 1), endY / (this.transform?.k || 1)]
      const points = [
        [startX, startY],
        [(startX + realEndX) / 2, (startY + realEndY) / 2 + 20],
        [realEndX, realEndY]
      ]
      const path = curve(points)
      d3.select('#addLinkLine')
        .attr('d', path)
        .attr('stroke', MarkerColor.EMPHASIS)
        .attr('fill', 'none')
        .attr('stroke-width', 2)
        .attr('marker-end', `url(#${getMarkerId('end', MarkerColor.EMPHASIS)})`)
    }
  }
  private globalClickHandler = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (this.isAddingEdge) {
        this.endAddEdge()
      }
    }
  }
  public getRelatedNodesAndEdges = (sourceNode: GraphNode) => {
    const sourceToTargetEdges = this.originEdges?.filter(i => i.source.id === sourceNode.id) || []
    const targetToSourceEdges = this.originEdges?.filter(i => i.target.id === sourceNode.id) || []
    const sourceToTargetNodes = this.originNodes?.filter(i => sourceToTargetEdges?.some(o => o.target.id === i.id)) || []
    const targetToSourceNodes = this.originNodes?.filter(i => targetToSourceEdges?.some(o => o.source.id === i.id)) || []
    return { sourceToTargetEdges, targetToSourceNodes, targetToSourceEdges, sourceToTargetNodes }
  }
  private drawEdge = (edge, sourceX, sourceY, targetX, targetY) => {
    const targetNode = this.nodesMap?.get(edge.targetId)
    const sourceNode = this.nodesMap?.get(edge.sourceId)

    const getRadius = (type?: string) => {
      return TypeToNodeRadius[type || 'normal']
    }
    const targetCircleCenterX = targetX + getRadius(targetNode?.type)
    const targetCircleCenterY = targetY + getRadius(targetNode?.type)
    const sourceCircleCenterX = sourceX + getRadius(sourceNode?.type)
    const sourceCircleCenterY = sourceY + getRadius(sourceNode?.type)
    const curve = d3.line()

    // check out whether double direction link
    const finalSourceX = sourceCircleCenterX
    const finalSourceY = sourceCircleCenterY
    const finalTargetX = targetCircleCenterX
    const finalTargetY = targetCircleCenterY

    const points = [
      [finalSourceX, finalSourceY],
      [finalTargetX, finalTargetY]
    ]
    return curve(points)
  }
}

export default D3GraphManager
