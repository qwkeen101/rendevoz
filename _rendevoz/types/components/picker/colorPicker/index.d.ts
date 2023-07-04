/// <reference types="react" />
interface ColorPickerProps {
    colors?: string[][];
    onPick: (color: string) => void;
    enableMore?: boolean;
    isFont?: boolean;
    enableDefault?: boolean;
    disableLinear?: boolean;
    text?: string;
}
export declare const Colors: string[][];
export declare const defaultFontColor = "#000000";
export declare const defaultBgColor = "#ffffff";
declare const _default: import("react").NamedExoticComponent<ColorPickerProps>;
export default _default;
