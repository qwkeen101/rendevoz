import { FC, MouseEvent, PointerEventHandler } from 'react';
import { IMenuLayoutItem } from '@/components/base/menu/index';
type MenuItemWithProps = IMenuLayoutItem & {
    selectedKey: string[];
    onSelect?: () => void;
    onPointerMove: PointerEventHandler;
    onClick: (item: IMenuLayoutItem, e: MouseEvent) => void;
};
declare const MenuItem: FC<MenuItemWithProps>;
export default MenuItem;
