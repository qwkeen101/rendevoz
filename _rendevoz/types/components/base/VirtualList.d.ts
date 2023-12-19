import { CSSProperties, ReactElement } from "react";
type Props<T> = {
    items: T[];
    renderItem: (item: T, idx: number) => ReactElement;
    estimateSize: number;
    style?: CSSProperties;
    childrenContainerClassname?: string;
};
declare function VirtualList<T>({ items, renderItem, estimateSize, style, childrenContainerClassname }: Props<T>): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof VirtualList>;
export default _default;
