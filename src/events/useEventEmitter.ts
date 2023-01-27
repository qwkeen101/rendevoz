import { GlobalScope } from '@/jotai/jotaiScope'
import { eventEmitter } from '@/events/eventEmitter'
import { useAtomValue } from 'jotai'

const useEventEmitter = (scope: symbol = GlobalScope) => useAtomValue(eventEmitter, scope)
export default useEventEmitter
