import { forwardRef } from "react";
import { createPortal } from "react-dom";

export const PosHelper = forwardRef<HTMLDivElement, PosHelperProps>(
  ({ top, left, children }, ref) => {
    return createPortal(
      <div
        ref={ref}
        style={{
          position: "absolute",
          top: top,
          left: left,
          width: 1,
          height: 1,
        }}
      >
        {children}
      </div>,
      document.body
    );
  }
);
