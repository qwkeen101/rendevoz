import { Event } from './eventEmitter'
import EventHandler from './eventHandler'

interface ToggleContextMenuEvent {
  clientX: number
  clientY: number
  componentType: string
}
export interface GraphEventMap {
  toggleContextMenu: ToggleContextMenuEvent
}
export type GraphEvent = Event<GraphEventMap, keyof GraphEventMap>
export class GraphEventHandler extends EventHandler<GraphEventMap> {}
