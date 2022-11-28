// I don't want to use echarts anymore!!!!
// deprecated in 2022/11/24
// D3 is best!

import EventEmitter from '@/events/eventEmitter'
import Id from '@/utils/id'
import { ECharts } from 'echarts/core'
import _ from 'lodash'
import { ID_TO_HIDEN_NODES_MAP } from './weakMaps'

interface GraphNode {
  seriesIndex: number
  dataIndex: number
  data: any
}
class GraphManager {
  private isDraggingNode = false
  private isAddLink = false
  private instance: ECharts | null = null
  private linkStartPoint: number[] = []
  private linkStartNode: GraphNode | null = null
  private linkEndNode: GraphNode | null = null
  private contextMenuNode: GraphNode | null = null
  private hidenNodeIdToRealNodeMap = new Map<string, GraphNode>()
  private emitter: EventEmitter | null = null

  public registerEventEmitter = (emitter: EventEmitter) => {
    this.emitter = emitter
  }
  public registerEchartsInstance = (instance: ECharts) => {
    this.instance = instance
    ID_TO_HIDEN_NODES_MAP.set(instance, new Map())
    this.instance.on('highlight', parms => {
      console.log(parms)
    })
    this.instance.on('contextmenu', this.onNodeContextMenu)
    this.instance.getZr().on('mousemove', this.handleGlobalMouseMove)
    this.instance.getZr().on('mouseup', this.handleGloblaMouseUp)
    this.instance.getZr().on('mousedown', this.handleGlobalMouseDown)
  }
  public registerOption = option => {
    this.instance?.setOption(option)
    setTimeout(this.addHidenNodes, 0)
  }
  private handleGlobalMouseMove = params => {
    if (this.isAddLink) {
      const [sX, sY] = this.linkStartPoint
      const [eX, eY] = [params.event.zrX, params.event.zrY]
      const cX1 = (sX + eX) / 2,
        cY1 = sY,
        cX2 = cX1,
        cY2 = eY
      this.instance?.setOption({
        graphic: [
          {
            id: 'line',
            shape: {
              x2: eX,
              y2: eY,
              cpx1: cX1,
              cpy1: cY1,
              cpx2: cX2,
              cpy2: cY2
            }
          }
        ]
      })
    }
  }
  private handleGloblaMouseUp = params => {
    if (this.isDraggingNode) {
      this.isDraggingNode = false
      this.addHidenNodes()

      this.instance?.setOption({
        animationDurationUpdate: 400
      })
    }
    setTimeout(() => {
      console.log(this.instance?.getOption())
    }, 200)
  }
  private handleGlobalMouseDown = params => {
    if (this.isAddLink) {
      this.instance?.dispatchAction({
        type: 'downplay'
      })
      this.isAddLink = false
      if (this.linkEndNode) {
        console.log(this.linkEndNode)
        const edges = (this.instance?.getOption().series as []).find(i => i.id === 'a').links as []
        edges.push({
          source: this.linkStartNode?.dataIndex,
          target: this.linkEndNode?.dataIndex
        })
        this.instance?.setOption({
          series: [
            {
              id: 'a',
              links: edges
            }
          ]
        })
      }
      setTimeout(() => {
        this.addHidenNodes()
      }, 0)
      setTimeout(() => {
        console.log(this.instance?.getOption())
      }, 200)
    }
  }
  private handleHiddenNodeMouseOver = params => {
    const hidenNodeId = params.target.id
    const realNode = this.hidenNodeIdToRealNodeMap.get(hidenNodeId)
    if (this.isAddLink) {
      if (realNode) {
        this.linkEndNode = realNode
        this.instance?.setOption({
          graphic: [
            {
              id: hidenNodeId,
              shape: {
                r: 20
              }
            }
          ]
        })
        this.instance?.dispatchAction({
          type: 'highlight',
          dataIndex: realNode.dataIndex,
          seriesIndex: realNode.seriesIndex
        })
        return
      }
    }
    if (this.isDraggingNode) return
    this.instance?.dispatchAction({
      type: 'highlight',
      dataIndex: realNode?.dataIndex,
      seriesIndex: realNode?.seriesIndex
    })
  }
  private handleHiddenNodeMouseOut = params => {
    const realNode = this.hidenNodeIdToRealNodeMap.get(params.target.id)
    if (this.isAddLink) {
      if (realNode && realNode?.dataIndex === this.linkEndNode?.dataIndex && realNode?.seriesIndex === this.linkEndNode?.seriesIndex) {
        this.instance?.dispatchAction({
          type: 'downplay',
          seriesIndex: this.linkEndNode?.seriesIndex,
          dataIndex: this.linkEndNode?.dataIndex
        })
        this.instance?.setOption({
          graphic: [
            {
              id: params.target.id,
              shape: {
                r: 16
              }
            }
          ]
        })
        this.linkEndNode = null
        return
      }
    }
    if (this.isDraggingNode) return
    this.instance?.dispatchAction({ type: 'downplay', dataIndex: realNode?.dataIndex, seriesIndex: realNode?.seriesIndex })
  }
  private addHidenNodes = () => {
    const graphSeries = (this.instance?.getOption().series as []).find(i => i.type === 'graph') as any | undefined
    this.hidenNodeIdToRealNodeMap.clear()
    if (graphSeries) {
      const graphNodes = (graphSeries.data as []) || undefined
      if (graphNodes) {
        this.instance?.setOption(
          {
            graphic: graphNodes.map((i, idx) => {
              const pixel = this.instance?.convertToPixel({ seriesIndex: 0 }, i.value)
              const hidenNode = {
                type: 'circle',
                id: Id.getStrId(),
                cursor: 'grabbing',
                position: pixel,
                shape: {
                  cx: 0,
                  cy: 0,
                  r: 16
                },
                invisible: true,
                draggable: true,
                transition: 'shape',
                updateAnimation: {
                  duration: 300
                },
                ondrag: e => this.onNodeDragging(e, i, idx, 0),
                onmouseover: this.handleHiddenNodeMouseOver,
                onmouseout: this.handleHiddenNodeMouseOut,
                ondragstart: e => {
                  this.instance?.dispatchAction({
                    type: 'downplay'
                  })
                },
                // onmousedown: e => this.startDragLink(e, i, idx, 0),
                z: 100
              }
              this.hidenNodeIdToRealNodeMap.set(hidenNode.id, {
                seriesIndex: 0,
                dataIndex: idx,
                data: i
              })
              return hidenNode
            })
          },
          { replaceMerge: 'graphic' }
        )
      }
    }
  }
  public startDragLink = () => {
    this.isAddLink = true
    if (!this.linkStartPoint) return
    const startPoint = {
      x: this.linkStartPoint[0],
      y: this.linkStartPoint[1]
    }

    this.linkStartNode = this.contextMenuNode
    const nodes = this.instance?.getOption().series[0].data
    nodes.forEach(i => (i.silent = true))
    console.log(nodes)
    this.instance?.setOption({
      series: [
        {
          id: 'a',
          data: nodes
        }
      ],
      graphic: [
        {
          id: 'line',
          type: 'bezierCurve',
          fill: '#8590ae',
          lineWidth: 3,
          shape: {
            x1: startPoint.x,
            y1: startPoint.y,
            cpx1: startPoint.x,
            cpy1: startPoint.y,
            x2: startPoint.x,
            y2: startPoint.y
          }
        }
      ]
    })
  }
  private onNodeDragging = (e, node, dataIndex, seriesIndex) => {
    this.isDraggingNode = true
    this.instance?.setOption({
      animationDurationUpdate: 0
    })
    const pos = [e.offsetX, e.offsetY]
    const convertedPos = this.instance?.convertFromPixel({ seriesIndex: 0 }, pos)
    const nodes = (this.instance?.getOption().series as [])[seriesIndex].data
    nodes[dataIndex] = {
      ...nodes[dataIndex],
      value: convertedPos
    }
    // Update data
    this.instance?.setOption({
      series: [
        {
          id: 'a',
          data: nodes
        }
      ]
    })
  }
  private onNodeContextMenu = params => {
    if (params.componentType === 'graphic') {
      const realNode = this.hidenNodeIdToRealNodeMap.get(params.event.target.id)
      if (realNode) {
        this.contextMenuNode = {
          ...realNode
        }
      }
      const [clientX, clientY] = [params.event.event.clientX, params.event.event.clientY]
      const [zrX, zrY] = [params.event.event.zrX, params.event.event.zrY]

      this.linkStartPoint = [zrX, zrY]
      this.emitter?.emit('graph', {
        type: 'toggleContextMenu',
        data: {
          componentType: 'node',
          clientX,
          clientY,
          zrX,
          zrY
        }
      })
    }
  }
}

export default GraphManager
