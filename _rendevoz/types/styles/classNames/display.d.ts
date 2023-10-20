export declare const gridLayout: ({ rowGap, columnGap, itemMinWidth, }: {
    rowGap?: number;
    columnGap?: number;
    itemMinWidth?: number;
}) => string;
export declare const flexLayout: (alignItems?: string, justifyContent?: string, column?: boolean) => string;
export declare const childrenAllFlex: (alignItems?: string, justifyContent?: string, column?: boolean) => string;
