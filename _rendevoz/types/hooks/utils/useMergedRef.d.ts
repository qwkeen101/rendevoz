import { MutableRefObject, Ref } from "react";
export declare function assignRef<T = any>(ref: React.ForwardedRef<T>, value: T | null): void;
export declare function mergeRefs<T = any>(...refs: Ref<T>[]): (node: T | null) => void;
declare const useMergedRef: (...refs: (MutableRefObject<any> | undefined)[]) => (node: any | null) => void;
export default useMergedRef;
