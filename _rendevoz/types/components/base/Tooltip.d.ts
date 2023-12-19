import { CSSProperties, ReactNode } from "react";
import { AnimatePopoverProps } from "./AnimatePopover";
interface ToolTipProps {
    content?: string | ReactNode;
    position?: "top" | "bottom";
    style?: CSSProperties;
    delay?: number;
    disable?: boolean;
    disableDefaultContent?: boolean;
    contentTouchable?: boolean;
    zIndex?: string | number;
    visible?: boolean;
    onVisibleChange?: (v: boolean) => void;
    parentElement?: AnimatePopoverProps["parentElement"];
}
declare const _default: import("react").ForwardRefExoticComponent<ToolTipProps & {
    children?: ReactNode;
} & import("react").RefAttributes<unknown>>;
export default _default;
