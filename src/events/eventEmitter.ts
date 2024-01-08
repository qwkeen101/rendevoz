import Id from "@/utils/id";
import { atom } from "jotai";
import EventHandler from "./eventHandler";
import { EventMap } from "~/typings";

export interface EventCallback {
  onSuccess?: VoidFunction;
  onFail?: VoidFunction;
}

export default class EventEmitter {
  private listeners: { [name: string]: Array<EventHandler<unknown>> } = {};
  private ackEvents: { name: string; data: any }[] = [];
  private intervalEventId?: NodeJS.Timer;
  private intervalTimes = 0;
  public addListener<K extends keyof EventMap>(
    name: K,
    handler: EventHandler<unknown>
  ) {
    if (!this.listeners[name]) {
      this.listeners[name] = [];
    }

    this.listeners[name].push(handler);
  }

  public removeListener<K extends keyof EventMap>(
    name: K,
    handler: EventHandler<unknown>
  ) {
    const idx = this.listeners[name].findIndex((h) => Object.is(handler, h));
    idx > -1 && this.listeners[name].splice(idx, 1);
  }

  public removeAllListeners<K extends keyof EventMap>(name: K) {
    this.listeners[name] = [];
  }

  public emit<K extends keyof EventMap>(
    name: K,
    data?: EventMap[K] | { eventId: number },
    interval = false
  ) {
    data = {
      ...data,
      eventId: Id.getId(),
    };
    this.listeners[name]?.forEach((handler) => {
      handler.handle(data);
    });
    if (interval) {
      this.intervalEventId = setInterval(() => {
        this.listeners[name]?.forEach((handler) => {
          handler.handle(data);
        });
        this.intervalTimes += 1;
        if (this.intervalTimes > 100) {
          this.removeInterval();
        }
      }, 100);
    }
  }
  public emitWithCallback<K extends keyof EventMap>(
    name: K,
    data?: EventMap[K]
  ) {
    return new Promise((res, rej) => {
      this.listeners[name]?.forEach((handler) => {
        handler.handle(data, res, rej);
      });
    });
  }

  public getAckEvents() {
    return this.ackEvents;
  }
  public removeInterval() {
    this.intervalEventId && clearInterval(this.intervalEventId);
  }
  public removeAck(eventId: number) {
    this.ackEvents = this.ackEvents.filter((i) => i.data.eventId !== eventId);
  }
}
export const GlobalEventEmitter = new EventEmitter();

export const scopeEmitter = new EventEmitter()
export const eventEmitter = atom(scopeEmitter);
