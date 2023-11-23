import { CustomTypes, Event, MetaObject, Position } from "..";
import { IDraggableElement } from "../globalInstances/dragDrop";
import { Patch } from 'immer'
import { PrimitiveAtom } from 'jotai'
import { LocalDatabaseAction } from '../../../src/api/stores/types'

type DragDropEvent = {
  dropPosition: Position;
  target: EventTarget;
  dragElement: IDraggableElement;
  dragFrom: "editor" | "pdf" | "database";
} & DropOn;

export type BuiltInDropOn =
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

export type DropOn = CustomTypes['DropOn']

type GlobalDropNeedFurtherProcessEvent = {
  dropOn: DropOn
  draggingElement: IDraggableElement
  e?: DragEvent
}
type GlobalDragPointerUpEvent = {
  event: PointerEvent
  draggingElement: IDraggableElement
}
type GlobalDragPointerMoveEvent = {
  event: PointerEvent
  draggingElement: IDraggableElement
}
type GlobalNeedAddMetaObjectEvent = {
  currentObject: Partial<MetaObject>
  fromMetas?: MetaObject[]
}
type GlobalNeedEditMetaObjectEvent = {
  metaObjectId: number
}
type GlobalChooseMetaObjectEvent = {}

type GlobalValueChangeEvent = {
  patches: Patch[]
  inversePatches: Patch[]
  atom: PrimitiveAtom<any>
  databaseName: string
}
export interface GlobalEventMap {
  globalDropNeedAddLink: Partial<DragDropEvent>
  globalDropNeedFurtherProcess: GlobalDropNeedFurtherProcessEvent
  globalDragPointerUp: GlobalDragPointerUpEvent
  globalDragPointerMove: GlobalDragPointerMoveEvent
  globalNeedAddMetaObject: GlobalNeedAddMetaObjectEvent
  globalNeedEditMetaObject: GlobalNeedEditMetaObjectEvent
  globalChooseMetaObject: GlobalChooseMetaObjectEvent
  globalValueChange: GlobalValueChangeEvent
  startDownloadUpdate: VoidFunction
}

export type GlobalEvent = Event<GlobalEventMap, keyof GlobalEventMap>
