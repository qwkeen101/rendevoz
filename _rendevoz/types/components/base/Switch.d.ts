import { FC } from "react";
interface SwitchProps {
    onChange?: (value: boolean) => void;
    defaultValue?: boolean;
    width?: number;
    height?: number;
    value?: boolean;
}
declare const Switch: FC<SwitchProps>;
export default Switch;
