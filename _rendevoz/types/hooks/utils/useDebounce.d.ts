declare function useDebounce<T>(value: T, options?: {
    wait?: number;
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
}): T;
export default useDebounce;
