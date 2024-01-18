import {
  AnimatePopover,
  Content,
  Toolbar,
  WithBorder,
} from "@/components/base";
import { GlobalGraphInstance, useRenderObject } from "@/core";
import { useToggle } from "@/hooks";
import { PageSize } from "~/typings";
import { globalStore, ObjectStore } from "@/api/stores";
import { metaObjectsAtom } from "@/api/stores/meta/meta.store";
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { IObjectLabel } from "~/typings/data";
import Colors from "@/consts/colors";
import FontSize from "@/consts/font";

const ObjectLabel = ({
  labelId,
  pageSize,
}: {
  labelId: number;
  pageSize: PageSize;
}) => {
  const label = ObjectStore("pdfLabel").useValue(labelId) as IObjectLabel;
  const { renderInline, renderExpand, metaObject } = useRenderObject({
    metaObjectId: label.metaObjectId,
  });
  const [innerPosition, setInnerPosition] = useState<{
    x: number;
    y: number;
  }>();
  const [top, left] = label?.rect || [];
  const [popoverVisible, togglePopoverVisible] = useToggle(false);
  const [expanded, toggleExpanded] = useToggle(false);
  const store = ObjectStore("pdfLabel");
  const rndRef = useRef<Rnd>(null);
  useLayoutEffect(() => {
    const { width, height } = pageSize;
    if (top && left) {
      setInnerPosition({
        x: left * width,
        y: top * height,
      });
    }
  }, [pageSize, top, left]);

  useEffect(() => {
    if (!expanded) {
      rndRef.current?.updateSize({ width: "auto", height: "auto" });
    }
  }, [expanded]);
  return (
    <Rnd
      ref={rndRef}
      onDragStop={(e, data) => {
        store.updateOne(
          {
            id: labelId,
            rect: [data.y / pageSize.height, data.x / pageSize.width],
          },
          { silent: true }
        );
      }}
      position={innerPosition}
      bounds="parent"
      onResizeStop={(e, dir, ele, delta, pos) => {
        store.updateOne(
          {
            id: labelId,
            rect: [pos.y / pageSize.height, pos.x / pageSize.width],
          },
          { silent: true }
        );
      }}
      dragHandleClassName={expanded ? "dragHandle" : undefined}
      enableResizing={expanded}
      maxHeight="50%"
      maxWidth="50%"
      style={{
        pointerEvents: "auto",
        zIndex: 10,
        background: Colors.Background.Global,
        boxShadow: "0px 0px 0px 2px #dce3e8",
        borderRadius: 4,
      }}
    >
      <AnimatePopover
        visible={popoverVisible}
        onClickOutside={togglePopoverVisible}
        positions={["top", "bottom"]}
        padding={10}
        disableIntersection
        containerStyle={{
          borderRadius: "999px",
        }}
        content={
          <WithBorder padding="0px 12px" borderRadius={999}>
            <Toolbar>
              <Toolbar.Item
                tooltip="Delete"
                iconName="park-delete"
                onClick={() =>
                  ObjectStore("pdfLabel").deleteOneById(labelId, {
                    force: true,
                  })
                }
              />
              <Toolbar.Item
                tooltip="Graph"
                iconName="park-share-one"
                onClick={() =>
                  globalStore.get(metaObjectsAtom).has(label.metaObjectId) &&
                  GlobalGraphInstance?.open(
                    globalStore.get(metaObjectsAtom).get(label.metaObjectId)!
                  )
                }
              />
            </Toolbar>
          </WithBorder>
        }
      >
        <Content fullHeight fullWidth onClick={togglePopoverVisible}>
          {expanded && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: -30,
              }}
              className="dragHandle"
            >
              {metaObject?.name || "Unnamed Object"}
            </div>
          )}
          {expanded ? (
            <div
              style={{
                width: pageSize.width * 0.4,
                height: pageSize.height * 0.4,
                minWidth: "100%",
                maxHeight: "100%",
                maxWidth: "100%",
                minHeight: "100%",
                overflow: "hidden",
              }}
            >
              {renderExpand({})}
            </div>
          ) : (
            renderInline({
              ellipsisLine: 1,
              showHoverObjectDetails: true,
              showCircle: true,
              containerStyle: {
                padding: "6px 8px",
                maxWidth: pageSize.width * 0.2,
                fontSize: FontSize["12px"],
              },
            })
          )}
        </Content>
      </AnimatePopover>
    </Rnd>
  );
};

export default memo(ObjectLabel);
