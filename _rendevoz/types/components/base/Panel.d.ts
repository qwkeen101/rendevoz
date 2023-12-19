import React, { CSSProperties, Dispatch, ReactNode, SetStateAction } from "react";
interface PanelProps {
    title: string | React.ReactNode | ((set: Dispatch<SetStateAction<boolean>>) => ReactNode);
    children: React.ReactNode;
    style?: React.CSSProperties;
    defaultVisible?: boolean;
    className?: string;
    childrenStyle?: CSSProperties;
    titleContainerStyle?: CSSProperties;
    overflow?: "hidden" | "auto" | "visible";
}
declare const Panel: React.FC<PanelProps>;
export default Panel;
