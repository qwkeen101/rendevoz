type noop = (...args: any) => any;
declare function useDebounceFn<T extends noop>(fn: T, options?: {
    wait?: number;
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
}): {
    run: any;
    cancel: any;
    flush: any;
};
export default useDebounceFn;
