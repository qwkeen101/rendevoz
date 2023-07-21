import { CSSProperties, FC, ReactNode } from "react";
import SelectOption, { SelectOptionProps } from "./SelectOption";

interface SelectProps {
  multiple?: boolean;
  value?: string | string[] | number | number[];
  closeOnSelect?: boolean;
  disabled?: boolean;
  deselectable?: boolean;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  displayRenderer?: (value: string | string[] | number | number[]) => ReactNode;
  onSelect: (value: string[] | number[]) => void;
  style?: CSSProperties;
  menuStyle?: CSSProperties;
  menuPosition?: "top" | "bottom";
  options: SelectOptionProps[];
}
interface ISelect extends FC<SelectProps> {
    Option: typeof SelectOption;
}
declare const Select: ISelect;
export default Select;
