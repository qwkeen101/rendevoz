import { useEventHandler, useScopedEventEmitter } from '@/events'
import { GlobalEventEmitter } from '@/events/eventEmitter'
import EventEmitter from '@/events/eventEmitter'

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
