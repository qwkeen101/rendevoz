import {
  createStore,
  PrimitiveAtom,
  useAtom,
  useAtomValue,
  useSetAtom,
} from "jotai";
import { selectAtom } from "jotai/utils";
import { useMemo } from "react";

export const globalStore = createStore();

export const useGlobalAtom: typeof useAtom = (atom: Parameters<typeof useAtom>[0]) => useAtom(atom, { store: globalStore })

export const useGlobalAtomValue: typeof useAtomValue = (atom: Parameters<typeof useAtomValue>[0]) =>
  useAtomValue(atom, { store: globalStore })

export const useGlobalSetAtom: typeof useSetAtom = (atom: Parameters<typeof useSetAtom>[0]) => useSetAtom(atom, { store: globalStore })

export const useSelectAtomValue = <T, Slice>(atom: PrimitiveAtom<T>, selector: (v: T) => Slice): Slice =>
  useAtomValue(useMemo(() => selectAtom(atom, selector), []))

export const useSelectGlobalAtomValue = <T, Slice>(atom: PrimitiveAtom<T>, selector: (v: T) => Slice): Slice =>
  useGlobalAtomValue(useMemo(() => selectAtom(atom, selector), []))
