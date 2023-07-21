import { AvaliableGlobalDraggingElements } from '@/components/globalDragOverlay/GlobalDragOverlay'
import { Position } from '@/types'
import { Event } from './eventEmitter'
import EventHandler from './eventHandler'
import { IDraggableElement } from '~/typings'

type DragDropEvent = {
  dropPosition: Position
  target: EventTarget
  dragElement: AvaliableGlobalDraggingElements
  dragFrom: 'editor' | 'pdf' | 'database'
} & DropOn
export type DropOn =
  | {
      dropOn: 'database'
    }
  | {
      dropOn: 'editor'
      noteId: number
    }
  | {
      dropOn: 'pdf'
      pdfId: number
    }
  | {
      dropOn: 'whiteboard'
      whiteboardId: number
    }

type GlobalDropNeedFurtherProcessEvent = {
  dropOn: DropOn
  draggingElement: AvaliableGlobalDraggingElements
}
type GlobalDragPointerUpEvent = {
  event: PointerEvent
  draggingElement: IDraggableElement
}
type GlobalDragPointerMoveEvent = {
  event: PointerEvent
  draggingElement: AvaliableGlobalDraggingElements
}
export interface GlobalEventMap {
  globalDropNeedAddLink: Partial<DragDropEvent>
  globalDropNeedFurtherProcess: GlobalDropNeedFurtherProcessEvent
  globalDragPointerUp: GlobalDragPointerUpEvent
  globalDragPointerMove: GlobalDragPointerMoveEvent
  globalNeedAddMetaObject: VoidFunction
}

export type GlobalEvent = Event<GlobalEventMap, keyof GlobalEventMap>

export class GlobalEventHandler extends EventHandler<GlobalEventMap> {}
