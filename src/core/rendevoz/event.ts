import { useEventHandler, useScopedEventEmitter } from '@/events'
import EventEmitter, { GlobalEventEmitter } from '@/events/eventEmitter'

const emitEventGlobally = (...params: Parameters<EventEmitter['emit']>) => {
  GlobalEventEmitter.emit(...params)
}

const Emit = {
  emitEventGlobally,
  GlobalEventEmitter: GlobalEventEmitter,
  useEventHandler: type => useEventHandler(type),
  useScopedEventEmitter: () => useScopedEventEmitter()
}

export default Emit
