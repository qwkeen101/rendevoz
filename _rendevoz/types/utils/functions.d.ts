export declare const waitFor: (condition: () => boolean, func: () => void, options?: {
    timeout?: number;
    checkDelay?: number;
    checkTime?: number;
    checkEnsure?: number;
}) => void;
export declare function delay(ms: number): Promise<unknown>;
export declare const loopProcess: <T>(items: T[], processor: (item: T, index: number) => Promise<void>, cbs?: {
    onEndProcess?: (item: T, index: number) => void;
    onBeginProcess?: (item: T, index: number) => void;
    onEnd?: () => void;
}) => void;
