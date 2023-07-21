import * as React from "react";

export declare const useWindowResizeListener: (
  listener: (event: UIEvent) => any
) => void;
type UserRef<T> = ((instance: T | null) => void) | React.RefObject<T> | null | undefined;
declare const useComposedRef: <T extends HTMLElement>(libRef: React.MutableRefObject<T>, userRef: UserRef<T>) => (instance: T) => void;
export default useComposedRef;
