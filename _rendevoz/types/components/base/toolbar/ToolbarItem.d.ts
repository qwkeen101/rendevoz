import { CSSProperties, FC, MouseEventHandler, ReactNode } from 'react';
interface ToolbarItemProps {
    onClick?: MouseEventHandler;
    className?: string;
    title?: string;
    size?: number;
    iconClassName?: string;
    children?: ReactNode;
    style?: CSSProperties;
    iconName?: string;
    space?: number;
    isActive?: boolean;
    disabled?: boolean;
    clickPreventDefault?: boolean;
    tooltip?: string;
}
declare const ToolbarItem: FC<ToolbarItemProps>;
export default ToolbarItem;
