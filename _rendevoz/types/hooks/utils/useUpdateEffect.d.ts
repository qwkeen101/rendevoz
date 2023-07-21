import { useEffect, useLayoutEffect } from "react";

type EffectHookType = typeof useEffect | typeof useLayoutEffect;
export declare const createUpdateEffect: (hook: EffectHookType) => EffectHookType;
declare const useUpdateEffect: EffectHookType;
export default useUpdateEffect;
