import { FC, ReactNode } from "react";

interface MenuGroupProps {
  title: string;
  children: ReactNode;
}
declare const MenuGroup: FC<MenuGroupProps>;
export default MenuGroup;
