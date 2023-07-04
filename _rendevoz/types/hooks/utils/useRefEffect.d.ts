/// <reference types="react" />
/**
 * `useRefEffect` returns a mutable ref object to be connected with a DOM Node.
 *
 * The returned object will persist for the full lifetime of the component.
 * Accepts a function that contains imperative, possibly effectful code.
 *
 * @param effect Imperative function that can return a cleanup function
 * @param deps If present, effect will only activate if the ref or the values in the list change.
 */
export declare const useRefEffect: <T extends unknown>(initialValue: T, effect: (element: T) => void | (() => void), dependencies?: any[]) => ((instance: T) => void) & import("react").MutableRefObject<T>;
