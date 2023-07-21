import * as Drag from "./drag";
import * as Background from "./background";

declare const ClassName: {
  Drag: typeof Drag;
  Background: typeof Background;
  disableUserSelect: string;
  TagBackgrounds: {
    blue: string;
    amber: string;
    grey: string;
    transparent: string;
  };
  tag: (
    background?: string,
    color?: string,
    backdropFilter?: string,
    fontSize?: any
  ) => string;
  objectTag: string;
  input: () => string;
  noStyleInput: string;
  circleButton: (padding?: number, borderRadius?: number) => string;
  flatButton: (
    borderRadius?: number,
    padding?: string,
    background?: any,
    border?: boolean
  ) => string;
  gridLayout: ({
    rowGap,
    columnGap,
    itemMinWidth,
  }: {
    rowGap?: number;
    columnGap?: number;
    itemMinWidth?: number;
  }) => string;
  flexLayout: (
    alignItems?: string,
    justifyContent?: string,
    column?: boolean
  ) => string;
  childrenAllFlex: (
    alignItems?: string,
    justifyContent?: string,
    column?: boolean
  ) => string;
  ellipsisFont: (line: number) => string;
  defaultFont: (fontSize?: any, fontWeight?: number) => string;
  title: (fontSize?: any, fontWeight?: number, color?: string) => string;
  animatedBorderBottom: (
    bottom?: number,
    left?: number,
    height?: number,
    background?: string
  ) => string;
  description: (fontSize?: any, fontWeight?: number, color?: string) => string;
  disableAllTextTransform: string;
  link: () => string;
};
export default ClassName;
