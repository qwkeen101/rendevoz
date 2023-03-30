import { Descendant } from 'slate'
import { CustomElement, Event } from '..'

export interface ElementPropertyChangeEvent {
  element: CustomElement
}
export interface IndicatorChangeEvent {
  direction?: string
  id?: number
}

export interface InsertTabEvent {
  id?: string
  panelId?: string
  noteId?: number
  parentNoteId?: number
  autoFocus?: boolean
  isNew?: boolean
}

export type OuterElementPropertyChangeEvent = ElementPropertyChangeEvent

export interface SelectBlockEvent {
  blockId: number
}

export interface ValueChangeEvent {
  noteId: number
  value: Descendant[]
}

export interface OperationAppliedEvent {
  noteId: number
  id: string
  operation: Operation
}

export interface TabelCellOpEvent {
  type: 'pointerEnterCell' | 'pointerLeaveCell' | 'pointerEnterResizer' | 'pointerLeaveResizer' | 'selectCol'
  colName: string
  rowIndex?: number
  tableId: number
}
export interface EditorEventMap {
  compositionStart: VoidFunction
  compositionEnd: VoidFunction
  selectBlock: SelectBlockEvent
  indicatorChange: IndicatorChangeEvent
  insertTab: InsertTabEvent
  elementPropertyChange: ElementPropertyChangeEvent
  outerElementPropertyChange: OuterElementPropertyChangeEvent
  valueChange: ValueChangeEvent
  operationApplied: OperationAppliedEvent
  tableCellOp: TabelCellOpEvent
}

export type EditorEvent = Event<EditorEventMap, keyof EditorEventMap>
