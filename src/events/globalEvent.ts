import { AvaliableGlobalDraggingElements } from '@/components/globalDragOverlay/GlobalDragOverlay'
import { Position } from '@/types'
import { INote } from '~/typings/data'
import { Event } from './eventEmitter'
import EventHandler from './eventHandler'

type DragDropEvent = {
  dropPosition: Position
  target: EventTarget
  dragElement: AvaliableGlobalDraggingElements
  dragFrom: 'editor' | 'pdf' | 'database'
} & DropOn
type DropOn =
  | {
      dropOn: 'database'
    }
  | {
      dropOn: 'editor'
      note: INote
      noteId: number
    }
  | {
      dropOn: 'pdf'
      pdfId: number
    }

type DropOnEditorFurtherProcessEvent = {
  objectId: number
  noteId: number
}
export interface GlobalEventMap {
  dragDrop: Partial<DragDropEvent>
  dropOnEditorFurtherProcess: DropOnEditorFurtherProcessEvent
}
export type GlobalEvent = Event<GlobalEventMap, keyof GlobalEventMap>

export class GlobalEventHandler extends EventHandler<GlobalEventMap> {}
