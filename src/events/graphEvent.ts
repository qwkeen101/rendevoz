import { GraphEdge } from '@/components/graph/types/edge'
import { Event } from './eventEmitter'
import EventHandler from './eventHandler'

interface ToggleContextMenuEvent {
  clientX: number
  clientY: number
  componentType: string
}
interface ToggleEdgeAttributeCardEvent {
  edge: GraphEdge
  clientX: number
  clientY: number
}
export interface GraphEventMap {
  toggleContextMenu: ToggleContextMenuEvent
  toggleEdgeAttributeCard: ToggleEdgeAttributeCardEvent
}
export type GraphEvent = Event<GraphEventMap, keyof GraphEventMap>
export class GraphEventHandler extends EventHandler<GraphEventMap> {}
