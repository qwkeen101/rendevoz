import { FC } from "react";

export type SelectOptionProps =
  | {
      children: string;
      value: string | number;
      icon?: string;
    }
  | boolean;
declare const SelectOption: FC<SelectOptionProps>;
export default SelectOption;
