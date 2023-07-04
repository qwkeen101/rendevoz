import React, { CSSProperties } from 'react';
import { Property } from 'csstype';
export interface IconProps {
    name: string;
    theme?: 'outline' | 'filled' | 'two-tone' | 'multi-color';
    strokeWidth?: number;
    size?: number;
    spin?: boolean;
    cursor?: Property.Cursor;
    className?: string;
    containerStyle?: CSSProperties;
    containerClassName?: string;
    fill?: string | string[];
    color?: string;
    style?: CSSProperties;
    onClick?: React.MouseEventHandler;
    onPointerDown?: React.PointerEventHandler;
    onPointerMove?: React.PointerEventHandler;
    onPointerUp?: React.PointerEventHandler;
    draggable?: boolean;
}
declare const Icon: import("react").ForwardRefExoticComponent<IconProps & import("react").RefAttributes<HTMLDivElement>>;
export default Icon;
