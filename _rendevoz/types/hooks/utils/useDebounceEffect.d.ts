import type { DependencyList, EffectCallback } from "react";
declare function useDebounceEffect(effect: EffectCallback, deps?: DependencyList, options?: {
    wait?: number;
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
}): void;
export default useDebounceEffect;
