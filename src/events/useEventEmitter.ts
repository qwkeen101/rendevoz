import { eventEmitter, GlobalEventEmitter as G, scopeEmitter, default as EventEmitter } from "@/events/eventEmitter";
import { useAtomValue, useStore } from 'jotai'

export const useScopedEventEmitter = () => {
  const v = useAtomValue(eventEmitter)
  const store = useStore()
  if(v === scopeEmitter){
    const newS = new EventEmitter()
    store.set(eventEmitter, newS)
    return newS
  }
  return v
};

export const GlobalEventEmitter = () => G;

export default useScopedEventEmitter;
