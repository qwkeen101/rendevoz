declare const SIZING_STYLE: readonly ["borderBottomWidth", "borderLeftWidth", "borderRightWidth", "borderTopWidth", "boxSizing", "fontFamily", "fontSize", "fontStyle", "fontWeight", "letterSpacing", "lineHeight", "paddingBottom", "paddingLeft", "paddingRight", "paddingTop", "tabSize", "textIndent", "textRendering", "textTransform", "width", "wordBreak"];
type SizingProps = Extract<typeof SIZING_STYLE[number], keyof CSSStyleDeclaration>;
type SizingStyle = Pick<CSSStyleDeclaration, SizingProps>;
export type SizingData = {
    sizingStyle: SizingStyle;
    paddingSize: number;
    borderSize: number;
};
declare const getSizingData: (node: HTMLElement) => SizingData | null;
export declare const noop: () => void;
export declare const pick: <Obj extends {
    [key: string]: any;
}, Key extends keyof Obj>(props: Key[], obj: Obj) => Pick<Obj, Key>;
export default getSizingData;
