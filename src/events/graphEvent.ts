import { GraphEdge } from '@/components/graph/types/edge'
import { MetaObject } from '~/typings/data'
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
export interface ToggleGlobalGraphEvent {
  // the node we are hoping to see,no other nodes visible
  centerNode: Partial<MetaObject>
  // whether to show all nodes
  showAll?: boolean
}
export interface GraphEventMap {
  toggleContextMenu: ToggleContextMenuEvent
  toggleEdgeAttributeCard: ToggleEdgeAttributeCardEvent
  toggleGlobalGraph: ToggleGlobalGraphEvent
}
export type GraphEvent = Event<GraphEventMap, keyof GraphEventMap>
export class GraphEventHandler extends EventHandler<GraphEventMap> {}
