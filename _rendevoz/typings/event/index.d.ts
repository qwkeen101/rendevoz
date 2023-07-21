import { EditorEvent, GlobalEvent, PdfEvent } from "..";

export interface Event<T, K extends keyof T> {
  readonly type: K;
  readonly data?: T[K];
}

export interface EventMap {
  editor: EditorEvent
  pdf: PdfEvent
  global: GlobalEvent
  whiteboard: WhiteboardEvent
}

export interface IEventHandler<T> {
  on: <K extends keyof T>(type: K, handler: (data: T[K], res?: typeof Promise.resolve, rej?: typeof Promise.reject) => void) => void
  handle: (event: any, res?: typeof Promise.resolve, rej?: typeof Promise.reject) => void
}

export interface IEventEmitter {
  addListener: <K extends keyof EventMap>(name: K, handler: IEventHandler<unknown>) => void
  removeListener: <K extends keyof EventMap>(name: K, handler: IEventHandler<unknown>) => void
  removeAllListeners: <K extends keyof EventMap>(name: K) => void
  emit: <K extends keyof EventMap>(name: K, data?: EventMap[K]) => void
  emitWithCallback: <K extends keyof EventMap>(name: K, data?: EventMap<K>) => Promise<unknown>
}

export * from './editor'
export * from './global'
export * from './pdf'
