type noop = (...args: any) => any;
declare function useThrottleFn<T extends noop>(fn: T, options: any): {
    run: any;
    cancel: any;
    flush: any;
};
export default useThrottleFn;
