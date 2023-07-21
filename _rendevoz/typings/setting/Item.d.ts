import { CSSProperties, FC, ReactNode } from "react";

type SettingItem = {
  children?: ReactNode;
  title: string;
  description?: string;
  column?: boolean;
  titleSize?: number;
  childrenContainerStyle?: CSSProperties;
  disableDescriptionFormat?: boolean;
  type?: "title" | "item";
};
declare const SettingItem: FC<SettingItem>
export default SettingItem
