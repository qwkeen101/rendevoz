import { DependencyList, EffectCallback } from "react";
export declare const useRefDepsEffect: (effect: EffectCallback, refDeps: DependencyList) => void;
type UseEffectLike = (effect: EffectCallback, deps?: DependencyList) => void;
export declare function createRefDepsHook(useEffectLike: UseEffectLike): (effect: EffectCallback, refDeps: DependencyList) => void;
export {};
