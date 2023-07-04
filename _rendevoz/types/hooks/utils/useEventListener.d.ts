/**
 * Helper to remove plumbing involved with adding and removing an event listener
 * in components.
 *
 * @param eventName The name of the event to listen to.
 * @param handler The handler to call when the event is triggered.
 * @param element The element to attach the event listener to.
 * @param options The options to pass to the event listener.
 */
export default function useEventListener<T extends EventListener>(eventName: string, handler: T, element?: Window | Node, options?: AddEventListenerOptions): void;
