import { Event, GlobalDraggingDetails, MetaObject, Position } from '..'

type DragDropEvent = {
  dropPosition: Position
  target: EventTarget
  dragElement: GlobalDraggingDetails
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
  | {
      dropOn: 'attachment'
      parentMetaId: number
    }

type GlobalDropNeedFurtherProcessEvent = {
  dropOn: DropOn
  draggingElement: GlobalDraggingDetails
  e?: DragEvent
}
type GlobalDragPointerUpEvent = {
  event: PointerEvent
  draggingElement: GlobalDraggingDetails
}
type GlobalDragPointerMoveEvent = {
  event: PointerEvent
  draggingElement: GlobalDraggingDetails
}
type GlobalNeedAddMetaObjectEvent = {
  currentObject: Partial<MetaObject>
  fromMetas?: MetaObject[]
}
type GlobalNeedEditMetaObjectEvent = {
  metaObjectId: number
}
type GlobalChooseMetaObjectEvent = {}
export interface GlobalEventMap {
  globalDropNeedAddLink: Partial<DragDropEvent>
  globalDropNeedFurtherProcess: GlobalDropNeedFurtherProcessEvent
  globalDragPointerUp: GlobalDragPointerUpEvent
  globalDragPointerMove: GlobalDragPointerMoveEvent
  globalNeedAddMetaObject: GlobalNeedAddMetaObjectEvent
  globalNeedEditMetaObject: GlobalNeedEditMetaObjectEvent
  globalChooseMetaObject: GlobalChooseMetaObjectEvent
}

export type GlobalEvent = Event<GlobalEventMap, keyof GlobalEventMap>
