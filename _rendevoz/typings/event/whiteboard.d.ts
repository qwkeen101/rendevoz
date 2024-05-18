import { Event } from '..'
export interface WhiteboardEventMap {
}

export type WhiteboardEvent = Event<WhiteboardEventMap, keyof WhiteboardEventMap>
