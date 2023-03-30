import { eventEmitter } from '@/events/eventEmitter'
import { useAtomValue } from 'jotai'
import { globalStore } from '@/stores'
export const useScopedEventEmitter = () => useAtomValue(eventEmitter)

export const useGlobalEventEmitter = () => useAtomValue(eventEmitter, { store: globalStore })

export const GlobalEventEmitter = () => globalStore.get(eventEmitter)

export default useScopedEventEmitter
