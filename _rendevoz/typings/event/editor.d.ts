import { Event } from '..'
import { Operation } from 'slate'

export interface IndicatorChangeEvent {
  direction?: string
  id?: number
}

export interface OperationAppliedEvent {
  noteId: number
  id: string
  operation: Operation
}

export interface TableCellOpEvent {
  type: 'pointerEnterCell' | 'pointerLeaveCell' | 'pointerEnterResizer' | 'pointerLeaveResizer' | 'selectCol'
  colName: string
  rowIndex?: number
  tableId: number
}
export interface EditorEventMap {
  /**
   * These are scoped event
   */
  compositionStart: VoidFunction
  compositionEnd: VoidFunction
  valueChange: VoidFunction
  tableCellOp: TableCellOpEvent
  /**
   * This is global event
   */
  operationApplied: OperationAppliedEvent
}

export type EditorEvent = Event<EditorEventMap, keyof EditorEventMap>
