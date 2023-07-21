import { CSSProperties, FC, ImgHTMLAttributes, ReactNode } from "react";

declare const Image: FC<
  ImgHTMLAttributes<HTMLImageElement> & {
    placeHolderSize?: number;
    placeHolder?: ReactNode;
    ratio?: number;
    preview?: boolean;
    minWidth?: number;
    containerStyle?: CSSProperties;
    onPreview?: VoidFunction;
  }
>;
export default Image;
