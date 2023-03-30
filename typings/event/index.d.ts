import { EditorEvent, GlobalEvent, PdfEvent } from '..'

export interface Event<T, K extends keyof T> {
  readonly type: K
  readonly data?: T[K]
}

export interface EventMap {
  editor: EditorEvent
  pdf: PdfEvent
  global: GlobalEvent
  whiteboard: WhiteboardEvent
}

export * from './editor'
export * from './global'
export * from './pdf'
