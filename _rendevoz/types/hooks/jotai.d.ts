import { PrimitiveAtom, useAtom, useAtomValue, useSetAtom } from "jotai";
export declare const globalStore: {
    get: <Value>(atom: import("jotai").Atom<Value>) => Value;
    set: <Value_1, Args extends unknown[], Result>(atom: import("jotai").WritableAtom<Value_1, Args, Result>, ...args: Args) => Result;
    sub: (atom: import("jotai").Atom<unknown>, listener: () => void) => () => void;
    dev_subscribe_store: (l: (action: {
        type: "write";
        flushed: Set<import("jotai").Atom<unknown>>;
    } | {
        type: "async-write";
        flushed: Set<import("jotai").Atom<unknown>>;
    } | {
        type: "sub";
        flushed: Set<import("jotai").Atom<unknown>>;
    } | {
        type: "unsub";
    } | {
        type: "restore";
        flushed: Set<import("jotai").Atom<unknown>>;
    }) => void, rev: 2) => () => void;
    dev_get_mounted_atoms: () => IterableIterator<import("jotai").Atom<unknown>>;
    dev_get_atom_state: (a: import("jotai").Atom<unknown>) => {
        d: Map<import("jotai").Atom<unknown>, any & ({
            e: unknown;
        } | {
            v: unknown;
        })>;
    } & ({
        e: unknown;
    } | {
        v: unknown;
    });
    dev_get_mounted: (a: import("jotai").Atom<unknown>) => {
        l: Set<() => void>;
        t: Set<import("jotai").Atom<unknown>>;
        u?: () => void;
    };
    dev_restore_atoms: (values: Iterable<readonly [import("jotai").Atom<unknown>, unknown]>) => void;
} | {
    get: <Value_2>(atom: import("jotai").Atom<Value_2>) => Value_2;
    set: <Value_1_1, Args_1 extends unknown[], Result_1>(atom: import("jotai").WritableAtom<Value_1_1, Args_1, Result_1>, ...args: Args_1) => Result_1;
    sub: (atom: import("jotai").Atom<unknown>, listener: () => void) => () => void;
    dev_subscribe_store?: never;
    dev_get_mounted_atoms?: never;
    dev_get_atom_state?: never;
    dev_get_mounted?: never;
    dev_restore_atoms?: never;
};
export declare const useGlobalAtom: typeof useAtom;
export declare const useGlobalAtomValue: typeof useAtomValue;
export declare const useGlobalSetAtom: typeof useSetAtom;
export declare const useSelectAtomValue: <T, Slice>(atom: PrimitiveAtom<T>, selector: (v: T) => Slice) => Slice;
export declare const useSelectGlobalAtomValue: <T, Slice>(atom: PrimitiveAtom<T>, selector: (v: T) => Slice) => Slice;
