import { eventEmitter } from '@/events/eventEmitter'
import { useAtomValue } from 'jotai'
import { globalStore } from '@/stores'
const useScopedEventEmitter = () => useAtomValue(eventEmitter)

export const useGlobalEventEmitter = () => useAtomValue(eventEmitter, { store: globalStore })

export default useScopedEventEmitter
