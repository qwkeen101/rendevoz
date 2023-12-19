import React, { CSSProperties, FC, MouseEventHandler, ReactNode } from "react";
import IconButton from "./IconButton";
interface ButtonProps extends React.HTMLProps<HTMLDivElement> {
    children: ReactNode;
    onClick?: MouseEventHandler;
    className?: string;
    tabIndex?: number;
    style?: CSSProperties;
    selected?: boolean;
    disabled?: boolean;
}
interface IButton extends FC<ButtonProps> {
    IconButton: typeof IconButton;
}
export declare const Button: IButton;
export {};
