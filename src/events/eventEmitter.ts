import { EditorEvent } from '@/events/editorEvent'
import Id from '@/utils/id'
import { atom } from 'jotai'
import EventHandler from './eventHandler'
import { GlobalEvent } from './globalEvent'
import { GraphEvent } from './graphEvent'
import { LayoutEvent } from './layoutEvent'
import { PdfEvent } from './pdfEvent'

export interface Event<T, K extends keyof T> {
  readonly type: K
  readonly data?: T[K]
}
export interface EventMap {
  editor: EditorEvent
  pdf: PdfEvent
  graph: GraphEvent
  layout: LayoutEvent
  global: GlobalEvent
}
export default class EventEmitter {
  private listeners: { [name: string]: Array<EventHandler<unknown>> } = {}
  private ackEvents: { name: string; data: any }[] = []
  private intervalEventId?: NodeJS.Timer
  private intervalTimes = 0
  public addListener<K extends keyof EventMap>(name: K, handler: EventHandler<unknown>) {
    if (!this.listeners[name]) {
      this.listeners[name] = []
    }

    this.listeners[name].push(handler)
  }

  public removeListener<K extends keyof EventMap>(name: K, handler: EventHandler<unknown>) {
    const idx = this.listeners[name].findIndex(h => Object.is(handler, h))
    idx > -1 && this.listeners[name].splice(idx, 1)
  }

  public removeAllListeners<K extends keyof EventMap>(name: K) {
    this.listeners[name] = []
  }

  public emit<K extends keyof EventMap>(name: K, data?: EventMap[K] | { eventId: number }, interval = false) {
    data = {
      ...data,
      eventId: Id.getId()
    }
    this.listeners[name]?.forEach(handler => {
      handler.handle(data)
    })
    if (interval) {
      this.intervalEventId = setInterval(() => {
        console.log('interval')
        this.listeners[name]?.forEach(handler => {
          handler.handle(data)
        })
        this.intervalTimes += 1
        if (this.intervalTimes > 100) {
          this.removeInterval()
        }
      }, 100)
    }
  }

  public getAckEvents() {
    return this.ackEvents
  }
  public removeInterval() {
    this.intervalEventId && clearInterval(this.intervalEventId)
  }
  public removeAck(eventId: number) {
    this.ackEvents = this.ackEvents.filter(i => i.data.eventId !== eventId)
  }
}

export const eventEmitter = atom(new EventEmitter())
