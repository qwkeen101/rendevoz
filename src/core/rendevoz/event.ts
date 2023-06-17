import { GlobalEventEmitter } from '@/events/eventEmitter'
import EventEmitter from '@/events/eventEmitter'

const emitEventGlobally = (...params: Parameters<EventEmitter['emit']>) => {
  GlobalEventEmitter.emit(...params)
}

const Emit = {
  emitEventGlobally,
  GlobalEventEmitter: GlobalEventEmitter
}

export default Emit
