import { CSSProperties, DetailedHTMLProps, HTMLAttributes, MouseEventHandler, PropsWithChildren } from 'react';
interface WithBorderProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    boxShadowBorder?: boolean;
    solidBorder?: boolean;
    borderRadius?: number;
    style?: CSSProperties;
    className?: string;
    onClick?: MouseEventHandler;
    contentEditable?: boolean;
    disableClosePopover?: boolean;
    padding?: CSSProperties['padding'];
    blur?: boolean;
}
declare const _default: import("react").ForwardRefExoticComponent<Omit<PropsWithChildren<WithBorderProps>, "ref"> & import("react").RefAttributes<unknown>>;
export default _default;
