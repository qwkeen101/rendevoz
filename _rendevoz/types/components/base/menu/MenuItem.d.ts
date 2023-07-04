import { FC, MouseEventHandler } from 'react';
export interface MenuItemProps {
    onClick?: MouseEventHandler;
    onDoubleClick?: MouseEventHandler;
    onContextMenu?: MouseEventHandler;
    icon?: React.ReactNode;
    type: 'button' | 'link' | 'separator';
    children: React.ReactNode;
    selected?: boolean;
    id?: number | string;
    gap?: number;
    disabled?: boolean;
}
declare const MenuItem: FC<MenuItemProps>;
export default MenuItem;
