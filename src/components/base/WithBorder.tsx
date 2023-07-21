import ClassName from "@/styles/classNames";
import classNames from "classnames";
import {
  CSSProperties,
  DetailedHTMLProps,
  FC,
  forwardRef,
  HTMLAttributes,
  MouseEventHandler,
  PropsWithChildren,
} from "react";

interface WithBorderProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  boxShadowBorder?: boolean;
  solidBorder?: boolean;
  borderRadius?: number;
  style?: CSSProperties;
  className?: string;
  onClick?: MouseEventHandler;
  contentEditable?: boolean;
  disableClosePopover?: boolean;
  padding?: CSSProperties["padding"];
  blur?: boolean;
}

const WithBorder: FC<PropsWithChildren<WithBorderProps>> = (
  {
    borderRadius = 8,
    disableClosePopover = false,
    blur,
    children,
    style,
    onClick,
    className,
    contentEditable,
    padding,
    ...rest
  },
  ref
) => {
  const DefaultBorder: CSSProperties = {
    // boxShadow: boxShadowBorder ? 'rgba(0, 0, 0, 0.24) 0px 3px 8px' : undefined,
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: borderRadius,
    padding,
    ...style,
  };
  const handleClick = (e) => {
    // e.stopPropagation()
    onClick?.(e);
  };
  return (
    <div
      data-disable-close-popover={disableClosePopover}
      ref={ref}
      {...rest}
      onClick={handleClick}
      contentEditable={contentEditable}
      className={classNames(
        className,
        blur && ClassName.Background.pseudoBlubBackground
      )}
      style={DefaultBorder}
    >
      {children}
    </div>
  );
};

export default forwardRef(WithBorder);
