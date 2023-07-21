import { FC } from "react";

interface IconPickerProps {
  icons: string[];
  rowSize?: number;
  onIconPick: (icon: string) => void;
}
declare const IconPicker: FC<IconPickerProps>;
export default IconPicker;
