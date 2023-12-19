import { CSSProperties, FC, MouseEventHandler, ReactNode } from 'react';
import MenuGroup from './MenuGroup';
import MenuItem, { MenuItemProps } from './MenuItem';
interface MenuProps {
    title?: string;
    extra?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
    style?: CSSProperties;
    onClick?: MouseEventHandler;
    layout?: MenuItemProps[];
}
interface IMenu extends FC<MenuProps> {
    Item: typeof MenuItem;
    Group: typeof MenuGroup;
    NavigationMenu: typeof NavigationMenu;
}
declare const Menu: IMenu;
type MenuLayoutItem = {
    type: 'custom';
    children: ReactNode;
} | {
    type: 'item';
    icon?: string;
    text?: string | (() => string);
    disabled?: boolean;
    dangerous?: boolean;
    name: string;
    subMenu?: MenuLayoutItem[];
    hoverOpenSubMenu?: boolean;
} | {
    type: 'separator';
};
interface NavigationMenuProps {
    layout: MenuLayoutItem[];
    onClick?: (name: string) => void;
    keyboardNavigation?: boolean;
    style?: CSSProperties;
    className?: string;
}
export declare const NavigationMenu: FC<NavigationMenuProps>;
export default Menu;
