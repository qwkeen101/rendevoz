import { DetailedHTMLProps, HTMLAttributes } from 'react';
import { Property } from 'csstype';
interface ContentProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    position?: 'absolute' | 'relative' | 'fixed';
    flex?: boolean;
    column?: boolean;
    alignItems?: Property.AlignItems;
    justifyContent?: Property.JustifyContent;
    gap?: number | string;
    centered?: boolean;
    children?: React.ReactNode;
    className?: string;
    fullWidth?: boolean;
    fullHeight?: boolean;
    auto?: boolean;
}
declare const _default: import("react").MemoExoticComponent<import("react").ForwardRefExoticComponent<Omit<ContentProps, "ref"> & import("react").RefAttributes<HTMLDivElement>>>;
export default _default;
