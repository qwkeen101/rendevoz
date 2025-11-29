import { Patch } from 'immer'
import { PrimitiveAtom } from 'jotai/index'
import { Operation } from 'slate'
import { IDraggableElement } from '~/typings'

export type IGlobalEvents = {
  dragEnd: {
    event: PointerEvent | DragEvent
  }
  dragStart: void
  dragMove: {
    event: PointerEvent
  }
  databaseChange: {
    patches: Patch[]
    inversePatches: Patch[]
    atom: PrimitiveAtom<any>
    databaseName: string
  }
  editorOperationApplied: {
    noteId: number
    id?: string
    operation: Operation
  }
  editorValueSaved: {
    noteId: number
  }
  editorRefreshFromValue: {
    noteId: number[]
  }
  editorTurnElementsToSync: {
    syncBlockMetaId: number
    draggingDetails: IDraggableElement
  }
}
