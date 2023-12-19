import { CSSProperties, FC, ReactNode, Ref } from "react";
import ToolbarItem from "./ToolbarItem";
import ToolbarSeparator from "./ToolbarSeparator";
export interface ToolbarProps {
    direction?: "vertical" | "horizontal";
    children?: ReactNode;
    className?: string;
    itemClassName?: string;
    itemSpace?: number;
    itemSize?: number;
    itemClickPreventDefault?: boolean;
    style?: CSSProperties;
    innerRef?: Ref<HTMLDivElement>;
}
interface IToolbar extends FC<ToolbarProps> {
    Item: typeof ToolbarItem;
    Separator: typeof ToolbarSeparator;
}
declare const Toolbar: IToolbar;
export default Toolbar;
