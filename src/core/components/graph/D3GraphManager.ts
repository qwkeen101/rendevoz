import * as d3 from 'd3'
import { curveBasis } from 'd3'
import { GraphNode } from './types/node'
import { GraphEdge } from './types/edge'
import { getMarkerId } from './utils/getMarkerId'
import { MarkerColor } from '@/consts'
import { GraphOverlayManager } from './components/overlay/useGraphOverlay'
import { SetStateAction } from 'react'
import produce from 'immer'
import { PanZoom } from 'panzoom'
import { TypeToRegisteredMetaObject } from '@/api/stores/meta/meta.store'
import { Viewport } from 'pixi-viewport'
import { Container, DisplayObject } from 'pixi.js'
import { XYPosition } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'
const getRadius = Rendevoz.Utils.Meta.getTypeRadius
class D3GraphManager {
  public isChoosingNode: false | 'start' | 'end' = false
  public container: d3.Selection<HTMLElement, unknown, null, any> | null = null
  private transform = null
  public d3Simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null
  public isDragging = false
  public contextMenuNode: GraphNode | null = null
  public currentHoverNode: GraphNode | null = null
  public originNodes: GraphNode[] | null = null
  public originEdges: GraphEdge[] | null = null
  public nodesMap: Map<number, GraphNode> | null = null
  public edgesMap: Map<number, GraphEdge> | null = null
  public setNodes?: (update: SetStateAction<GraphNode[] | null>) => void
  public setEdges?: (update: SetStateAction<GraphEdge[] | null>) => void
  private linkStartPoint = null
  public zoom?: d3.ZoomBehavior<Element, unknown>
  public panzoom?: PanZoom
  public pixiViewport?: Viewport
  public centerNodeId?: number
  public type: 'canvas' | 'svg' = 'canvas'
  // edge to edge map
  public oppositeEdgesMap = new Map<number, GraphEdge>()
  public CACHED_ICON_TEXTURE = new Map<string, any>()
  public ID_TO_PIXI_NODE_MAP = new Map<number, Container<DisplayObject>>()
  public ID_TO_PIXI_EDGE_MAP = new Map<number, Container<DisplayObject>>()
  public isAddingEdge = false
  public newAddedEdge: GraphEdge | null = null
  private changeHandlerSet: Set<(nodes: GraphNode[], edges: GraphEdge[]) => void> = new Set()
  private zoomHandlerSet: Set<(transform: any) => void> = new Set()
  public overlayManager?: GraphOverlayManager
  public transformScale = 1
  public currentClickNodeId?: number
  public currentClickEdgeId?: number
  private ID_TO_NODE_ELEMENT_MAP = new Map<number, SVGElement>()
  private ID_TO_EDGE_ELEMENT_MAP = new Map<number, SVGElement>()
  public ID_TO_EDGE_LABEL_ELEMENT_MAP = new Map<number, SVGElement>()
  public ID_TO_EDGE_FUNCTION_MAP = new Map<
    number,
    {
      drawEdge: VoidFunction
      resetLineWidth: (newWidth: number) => void
      hideLabel: VoidFunction
      unhidenLabel: VoidFunction
    }
  >()
  public ID_TO_NODE_FUNCTION_MAP = new Map<
    number,
    {
      changePosition: (pos: XYPosition) => void
    }
  >()
  public pinnedNodesIdsSet = new Set<number>()

  public getRadius = (type: string) => {
    const registered = TypeToRegisteredMetaObject.get(type)?.graphSettings?.collisionRadius
    if (registered) {
      return registered
    }
    const selfRadius = getRadius(type)
    return selfRadius * 10
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
  public registerContainer = (container: HTMLElement) => {}

  public deleteEdges = (edgeIds: number[]) => {
    this.setEdges?.(edges => {
      if (!edges) return edges
      return produce(edges, draft => {
        edgeIds.forEach(id => {
          const idx = draft?.findIndex(o => o.id === id)
          if (idx >= 0) {
            draft.splice(idx, 1)
          }
        })
      })
    })
    edgeIds.forEach(id => {
      const idx = this.originEdges?.findIndex(i => i.id === id)
      if (idx !== undefined && idx >= 0) {
        this.originEdges?.splice(idx, 1)
      }
      this.edgesMap?.delete(id)
      this.ID_TO_EDGE_FUNCTION_MAP.delete(id)
    })
  }
  public clear = () => {
    this.originEdges = null
    this.originNodes = null
    this.d3Simulation = null
    this.moved = false
    this.ID_TO_PIXI_NODE_MAP.clear()
    this.ID_TO_EDGE_FUNCTION_MAP.clear()
    this.ID_TO_NODE_FUNCTION_MAP.clear()
    this.ID_TO_PIXI_EDGE_MAP.clear()
  }
  public registerNodes = (nodes: GraphNode[]) => {
    this.originNodes = structuredClone(nodes)
    this.nodesMap = new Map(this.originNodes!.map(n => [n.id, n]))
  }

  public addNodes = (newNodes: GraphNode[]) => {
    const extraNodes = newNodes.filter(i => !this.nodesMap?.has(i.id))
    console.log(extraNodes)
    extraNodes.forEach(n => {
      const cloned = { ...n }
      this.originNodes?.push(cloned)
      this.nodesMap?.set(n.id, cloned)
    })
    this.setNodes?.(n => {
      const currentNodes = new Map(newNodes.map(i => [i.id, i]))
      n?.forEach(i => currentNodes.set(i.id, i))
      const nextNodes = Array.from(currentNodes.values())
      return nextNodes
    })
    console.log(this.originNodes)
  }

  public addEdges = (newEdges: GraphEdge[]) => {
    if (!this.originEdges || !this.edgesMap) return
    const extraEdges = newEdges.filter(i => !this.edgesMap?.has(i.id))
    console.log(extraEdges)
    extraEdges.forEach(e => {
      const cloned = { ...e, source: e.sourceId, target: e.targetId }
      this.originEdges!.push(cloned)
      this.edgesMap!.set(e.id, cloned)
    })
    this.setEdges?.(e => {
      const currentEdges = new Map(newEdges.map(i => [i.id, i]))
      e?.forEach(i => currentEdges.set(i.id, i))
      const nextEdges = Array.from(currentEdges.values())
      return nextEdges
    })
    console.log(this.originEdges)
  }

  public slightRestartSimu = () => {
    this.d3Simulation
      ?.nodes(this.originNodes?.filter(i => !i.hidden))
      .force('center', d3.forceCenter())
      .force('charge', d3.forceManyBody())
      .force(
        'link',
        d3
          .forceLink(this.originEdges?.filter(i => !i.hidden))
          .id(d => d.id)
          .distance(link => (link.target.type.includes('abel') || link.source.type.includes('abel') ? 100 : 200))
      )
      .alphaTarget(0.5)
      .on('tick', this.ticked)
      .restart()

    setTimeout(() => this.d3Simulation?.alphaTarget(0), 1000)
  }

  public registerEdges = (edges: GraphEdge[]) => {
    this.originEdges = structuredClone(edges)
    this.originEdges?.forEach(i => {
      i.source = i.sourceId
      i.target = i.targetId
    })
    this.edgesMap = new Map(this.originEdges?.map(e => [e.id, e]))
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
  public moved = false
  private simulateLayout = (reheat?: boolean, reinitialize?: boolean) => {
    if (this.originNodes?.length === 0 || !this.originNodes) return

    if (this.d3Simulation && !reinitialize) {
      this.d3Simulation
        .nodes(this.originNodes.filter(i => !i.hidden))
        .force(
          'link',
          d3
            .forceLink(this.originEdges?.filter(i => !i.hidden))
            .id(d => d.id)
            .distance(link => (link.target.type.includes('abel') || link.source.type.includes('abel') ? 100 : 200))
        )
        .force(
          'collision',
          d3.forceCollide().radius(n => this.getRadius(n.type))
        )
        .alpha(reheat ? 1 : 0)
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
        .distance(link => (link.target.type.includes('abel') || link.source.type.includes('abel') ? 100 : 200))

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
          setTimeout(() => {
            // this.ID_TO_EDGE_FUNCTION_MAP.forEach(i => i.drawEdge())
            this.ID_TO_EDGE_LABEL_ELEMENT_MAP.forEach(i => i.removeAttribute('opacity'))
          }, 50)
          if (!this.moved) {
            const node = Array.from(this.nodesMap?.values() || []).find(i => i.isCenter)
            if (node) {
              this.moveToNode(node.id)
            }
            this.moved = true
          }
          this.originNodes?.forEach(i => {
            i.fx = null
            i.fy = null
          })
          this.setNodes?.(nodes =>
            produce(nodes, draft => {
              draft?.forEach(n => {
                const thisNode = this.nodesMap?.get(n.id)
                n.x = thisNode?.x
                n.y = thisNode?.y
                if (n.fx) {
                  n.fx = null
                }
                if (n.fy) {
                  n.fy = null
                }
              })
            })
          )
        })
    }
  }
  public moveToNode = (nodeId: number) => {
    const node = Array.from(this.nodesMap?.values() || []).find(i => i.id === nodeId)
    if (this.pixiViewport && node && node.x !== undefined && node.y !== undefined) {
      this.pixiViewport.setTransform(-node.x + this.pixiViewport.screenWidth / 2, -node.y + this.pixiViewport.screenHeight / 2, 1, 1)
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

  public ticked = () => {
    this.d3Simulation?.tick(2)
    if (this.originEdges && this.originNodes) {
      if (this.type === 'canvas') {
        // canvas mode
        this.originNodes.forEach(node => {
          const n = this.ID_TO_PIXI_NODE_MAP.get(node.id)
          const bound = n?.children[0].getLocalBounds()
          if (n && bound) {
            n.x = node.x + bound.width / 2
            n.y = node.y + bound.height / 2
          }
        })
        this.originEdges.forEach(e => {
          const edgeFunc = this.ID_TO_EDGE_FUNCTION_MAP.get(e.id)
          edgeFunc?.drawEdge()
        })
      } else {
        // svg mode
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
    return {
      sourceToTargetEdges,
      targetToSourceNodes,
      targetToSourceEdges,
      sourceToTargetNodes
    }
  }
  private drawEdge = (edge, sourceX, sourceY, targetX, targetY) => {
    const targetNode = this.nodesMap?.get(edge.targetId)
    const sourceNode = this.nodesMap?.get(edge.sourceId)

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
