import { GraphNode } from './node'

export interface GraphEdge {
  id: number
  source?: GraphNode
  target?: GraphNode
  sourceId: number
  targetId: number
  opacity?: number
  label?: string
  highlight?: boolean
}
