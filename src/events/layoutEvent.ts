import { Noop } from '@/common/types'
import { Event } from './eventEmitter'
import EventHandler from './eventHandler'

interface ChangeTabTitleEvent {
  tabId: string
  newTitle: string
}
export interface LayoutEventMap {
  changeTabTitle: ChangeTabTitleEvent
}
export type LayoutEvent = Event<LayoutEventMap, keyof LayoutEventMap>

export class LayoutEventHandler extends EventHandler<LayoutEventMap> {}
