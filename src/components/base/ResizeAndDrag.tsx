import { css } from "@emotion/css";
import { FC, forwardRef } from "react";
import { Props, Rnd } from "react-rnd";

// @ts-ignore
export const disableWebviewPointer = css({
  "*": {
    pointerEvents: "none !important",
  },
  ".resize-handle *": {
    pointerEvents: "auto !important",
  },
});
// @ts-ignore
export const disableAllUserSelect = css({
  "*": {
    userSelect: "none !important",
  },
});
const ResizeAndDrag = forwardRef<Rnd, Props>((props, ref) => {
  return (
    <Rnd
      {...props}
      ref={ref}
      resizeHandleWrapperClass="resize-handle"
      onResizeStart={(...args) => {
        document.body.classList.add(
          disableWebviewPointer,
          disableAllUserSelect
        );
        props.onResizeStart?.(...args);
      }}
      onResizeStop={(...args) => {
        document.body.classList.remove(
          disableWebviewPointer,
          disableAllUserSelect
        );
        props.onResizeStop?.(...args);
      }}
      onDragStart={(...args) => {
        props.onDragStart?.(...args);
      }}
      onDragStop={(...args) => {
        props.onDragStop?.(...args);
      }}
    >
      {props.children}
    </Rnd>
  );
});

export default ResizeAndDrag as FC<Props>;
