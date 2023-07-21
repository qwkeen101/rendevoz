import { AnimatePopover } from "@/components";
import { Zindexes } from "@/consts";
import { useToggle } from "@/hooks";
import { css } from "@emotion/css";
import { memo, useEffect } from "react";
import ColumnMenu from "./ColumnMenu";
import RowMenu from "./RowMenu";
import Colors from "@/consts/colors";

const SlotClassName = css({
  background: Colors.Background.Secondary,
  transition: "background 0.2s ease",
  cursor: "pointer",
  zIndex: 10,
  ":hover": {
    background: Colors.Background.ButtonHover,
  },
});
type SlotProps = (
  | ({
      type: "row";
    } & Parameters<typeof RowMenu>[0])
  | ({
      type: "column";
    } & Parameters<typeof ColumnMenu>[0])
) & {
  width: number;
  height: number;
  onPopoverVisible: (v: boolean) => void;
};
const TableSlot = ({
  width,
  height,
  type,
  onPopoverVisible,
  ...rest
}: SlotProps) => {
  const [popoverVisible, togglePopoverVisible] = useToggle(false);

  useEffect(() => {
    if (!popoverVisible) {
      setTimeout(() => onPopoverVisible(popoverVisible), 300);
    } else {
      onPopoverVisible(popoverVisible);
    }
  }, [popoverVisible]);
  return (
    <AnimatePopover
      containerStyle={{ zIndex: String(Zindexes.PopupMenu) }}
      onClickOutside={togglePopoverVisible}
      visible={popoverVisible}
      content={
        type === "row" ? <RowMenu {...rest} /> : <ColumnMenu {...rest} />
      }
      positions={type === "row" ? ["left"] : ["top"]}
      boundaryElement={document.body}
      boundaryInset={30}
    >
      <div
        data-table-slot
        onClick={togglePopoverVisible}
        className={SlotClassName}
        style={{
          height,
          width,
        }}
      ></div>
    </AnimatePopover>
  );
};

export default memo(TableSlot);
