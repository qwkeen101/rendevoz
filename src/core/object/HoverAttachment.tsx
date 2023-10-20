import { AnimatePopover } from "@/components";
import { ReactNode, useEffect, useRef, useState } from "react";
import AttachmentWrapper from "./AttachmentWrapper";
import { Zindexes } from "@/consts";
import { AnimatePopoverProps } from "@/components/base/AnimatePopover";

const HoverAttachment = ({
  metaId,
  children,
  parentElement,
  maxWidth = 300,
  zIndex = Zindexes.AttachmentPopover,
}: {
  metaId: number;
  children: ReactNode;
  parentElement?: AnimatePopoverProps["parentElement"];
  zIndex?: number;
  maxWidth?: number;
}) => {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const clickHandler = (e) => {
      console.log("click");
      setVisible((s) => !s);
    };
    ref.current?.addEventListener("click", clickHandler);
    return () => ref.current?.removeEventListener("click", clickHandler);
  });

  return (
    <AnimatePopover
      visible={visible}
      innerRef={ref}
      parentElement={parentElement}
      padding={8}
      containerStyle={{ zIndex: String(zIndex) }}
      content={
        <AttachmentWrapper
          maxVisibleAttachments={5}
          renderAttOnParent={parentElement !== undefined}
          style={{ minWidth: 230, maxWidth }}
          visible
          closeIcon
          onClose={() => {
            setVisible(false);
          }}
          metaId={metaId}
        />
      }
      disableIntersection
      positions={["top", "bottom"]}
    >
      {children}
    </AnimatePopover>
  );
};

export default HoverAttachment;
