import { eventEmitter, GlobalEventEmitter as G } from "@/events/eventEmitter";
import { useAtomValue } from "jotai";

export const useScopedEventEmitter = () => useAtomValue(eventEmitter);

export const GlobalEventEmitter = () => G;

export default useScopedEventEmitter;
