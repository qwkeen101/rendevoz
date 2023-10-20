import { AnimatePopover, Content, Icon, WithBorder } from "@/components";
import { Zindexes } from "@/consts";
import { useToggle } from "@/hooks";
import ClassName from "@/styles/classNames";
import { css } from "@emotion/css";
import { ObjectActionPopover } from "./card/DatabaseCard";
import useRenderObject from "./useRenderObject";
import { memo, useMemo } from "react";

const DatabaseListItem = ({
  id,
  mode,
}: {
  id: number;
  mode: "all" | "title";
}) => {
  const { renderWhole } = useRenderObject({
    metaObjectId: id,
  });
  const [popoverVisible, togglePopoverVisible] = useToggle(false);
  const renderOptions = useMemo(
    () => ({
      renderOptions:
        mode === "all"
          ? {
              renderFrom: true,
              renderImage: true,
            }
          : mode === "title"
          ? {
              renderFrom: false,
              renderImage: false,
              renderDescription: false,
            }
          : { renderFrom: false, renderImage: true },
      descriptionOptions: {
        descriptionClassName: css([
          ClassName.description(),
          ClassName.ellipsisFont(1),
        ]),
      },
      tagsOptions: {
        showCreatedAt: true,
        showViewAt: true,
      },
      imageOptions: {
        width: mode === "all" ? 64 : 32,
        height: mode === "all" ? 64 : 32,
      },
      rowGap: 20,
    }),
    [mode]
  );
  return (
    <Content flex gap={12}>
      <AnimatePopover
        visible={popoverVisible}
        padding={10}
        containerStyle={{ zIndex: String(Zindexes.ToolBar) }}
        onClickOutside={togglePopoverVisible}
        content={
          <WithBorder>
            <ObjectActionPopover
              onClose={togglePopoverVisible}
              metaObjectId={id}
            />
          </WithBorder>
        }
        align="start"
        positions={["left", "right"]}
      >
        <Icon
          size={18}
          onClick={togglePopoverVisible}
          name="park-more"
          className={ClassName.circleButton()}
        />
      </AnimatePopover>
      {renderWhole(renderOptions)}
    </Content>
  );
};

export default memo(DatabaseListItem);
