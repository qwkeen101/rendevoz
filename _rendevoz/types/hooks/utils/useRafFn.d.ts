declare const useRafFn: (fn: (...args) => void) => {
    (...args: any[]): void;
    cancel(): void;
};
export default useRafFn;
