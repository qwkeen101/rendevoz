import * as d3 from 'd3'
import { GraphNode } from './types/node'
import { GraphEdge } from './types/edge'
import { getIntersectedPointsOfLineAndCircle } from './utils/getIntersectPoints'
import { curveBasis } from 'd3'
import { getMarkerId } from './utils/getMarkerId'
import { MarkerColor } from './consts/markerColors'

class D3GraphManager {
  private container: d3.Selection<HTMLElement, unknown, null, any> | null = null
  private transform = null
  public d3Simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null
  public isDragging = false
  public contextMenuNode: GraphNode | null = null
  public currentHoverNode: GraphNode | null = null
  public originNodes: any[] | null = null
  public originEdges: any[] | null = null
  private linkStartPoint = null

  public isAddingEdge = false
  public newAddedEdge: GraphEdge | null = null
  private changeHandlerSet: Set<(nodes: GraphNode[], edges: GraphEdge[]) => void> = new Set()
  private zoomHandlerSet: Set<(transform: any) => void> = new Set()

  private ID_TO_NODE_ELEMENT_MAP = new Map<number, SVGElement>()
  private ID_TO_EDGE_ELEMENT_MAP = new Map<number, SVGElement>()
  private ID_TO_EDGE_LABEL_ELEMENT_MAP = new Map<number, SVGElement>()
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
    this.container?.call(zoom)
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
        this.originNodes?.push({ id: n.id })
      })
      this.updateLayout()
    } else {
      // in originNodes we just need id, no other properties.
      this.originNodes = nodes.map(n => ({ id: n.id }))
    }
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
        this.N = d3.map(this.originNodes, n => n.id).map(intern)
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
    this.simulateForceLayout(reheat, reinitialize)
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
  private simulateForceLayout = (reheat?: boolean, reinitialize?: boolean) => {
    if (!this.originNodes || this.originNodes.length === 0) return
    if (this.d3Simulation && !reinitialize) {
      this.d3Simulation
        .nodes(this.originNodes)
        .force(
          'link',
          d3
            .forceLink(this.originEdges)
            .id(d => d.id)
            .distance(200)
        )
        .force(
          'collision',
          d3.forceCollide().radius(() => 100)
        )
        .alpha(reheat ? 0.8 : 0)
        .alphaTarget(0)
        .restart()
      return
    }
    if (this.originEdges && this.originNodes) {
      const forceNode = d3.forceManyBody()
      const forceLink = d3
        .forceLink(this.originEdges)
        .id(d => d.id)
        .distance(200)
      this.d3Simulation = d3
        .forceSimulation(this.originNodes)
        .force('link', forceLink)
        .force('charge', forceNode)
        .force('center', d3.forceCenter())
        .force(
          'collision',
          d3.forceCollide().radius(() => 100)
        )
        .on('tick', this.ticked)
        .on('end', () => {
          const clonedNodes = structuredClone(this.originNodes)
          const clonedEdges = structuredClone(this.originEdges)
          this.changeHandlerSet.forEach(handler => handler?.(clonedNodes, clonedEdges))
        })
    } else {
      console.error('No edges or nodes prepared!')
    }
  }

  private ticked = () => {
    if (this.originEdges && this.originNodes) {
      this.originEdges.forEach(edge => {
        const path = this.drawEdge(edge, edge.source.x, edge.source.y, edge.target.x, edge.target.y)
        this.ID_TO_EDGE_ELEMENT_MAP.has(edge.id) && d3.select(this.ID_TO_EDGE_ELEMENT_MAP.get(edge.id)!).attr('d', path)
        const oppositeEdge = this.originEdges?.find(i => i.source?.id === edge.targetId && i.target?.id === edge.sourceId)
        let offsetLabelRatio = 1
        if (oppositeEdge) {
          if (oppositeEdge.source?.id > edge.sourceId) {
            offsetLabelRatio = -1.5
          } else {
            offsetLabelRatio = 2.5
          }
        }

        const [centerX, centerY] = [(edge.source.x + edge.target.x) / 2, (edge.source.y + edge.target.y) / 2]
        this.ID_TO_EDGE_LABEL_ELEMENT_MAP.has(edge.id) &&
          d3
            .select(this.ID_TO_EDGE_LABEL_ELEMENT_MAP.get(edge.id)!)
            .attr('transform', `translate(${centerX + 5 * offsetLabelRatio},${centerY + 20 * offsetLabelRatio})`)
      })
      this.originNodes.forEach(node => {
        this.ID_TO_NODE_ELEMENT_MAP.has(node.id) &&
          d3.select(this.ID_TO_NODE_ELEMENT_MAP.get(node.id)!).attr('transform', `translate(${node.x},${node.y})`)
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
      // this.drawLineSelection?.attr('d', path.toString()).attr('stroke', 'black').attr('fill', 'none').attr('stroke-width', 1)
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
    const CIRCLE_RADIUS = 20
    const targetCircleCenterX = targetX + CIRCLE_RADIUS
    const targetCircleCenterY = targetY + CIRCLE_RADIUS
    const sourceCircleCenterX = sourceX + CIRCLE_RADIUS
    const sourceCircleCenterY = sourceY + CIRCLE_RADIUS
    const distance = Math.sqrt(
      Math.pow(targetCircleCenterX - sourceCircleCenterX, 2) + Math.pow(targetCircleCenterY - sourceCircleCenterY, 2)
    )
    const ratio = (CIRCLE_RADIUS + 10) / distance
    const dx = (targetCircleCenterX - sourceCircleCenterX) * ratio
    const dy = (targetCircleCenterY - sourceCircleCenterY) * ratio
    const curve = d3.line().curve(curveBasis)
    let offset = 30
    // check out whether double direction link
    if (this.originEdges) {
      const oppositeEdge = this.originEdges.find(i => i.source?.id === edge.targetId && i.target?.id === edge.sourceId)
      if (oppositeEdge && oppositeEdge.source?.id > edge.sourceId) offset = -30
    }
    const finalSourceX = sourceCircleCenterX + dx
    const finalSourceY = sourceCircleCenterY + dy
    const finalTargetX = targetCircleCenterX - dx
    const finalTargetY = targetCircleCenterY - dy

    const points = [
      [finalSourceX, finalSourceY],
      [(finalSourceX + finalTargetX) / 2, (finalSourceY + finalTargetY) / 2 + offset],
      [finalTargetX, finalTargetY]
    ]
    return curve(points)
  }
}
function intern(value) {
  return value !== null && typeof value === 'object' ? value.valueOf() : value
}

export default D3GraphManager
