declare const useRafFn: (fn: (...args: any[]) => void) => {
    (...args: any[]): void;
    cancel(): void;
};
export default useRafFn;
