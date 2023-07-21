import { Content, Icon, IconWithPopover, Image } from "@/components";
import { useSelectAtomValue } from "@/hooks";
import { VideoStateAtom } from "./hooks/useVideoState";
import { MetaStore, ObjectStore } from "@/stores";
import { useVideoInstance } from "./hooks/useVideoInstance";
import { useEffect, useRef, useState } from "react";
import { IVideoLabel } from "~/typings";
import ClassName from "@/styles/classNames";
import { normalizeSecondsToTime } from "./utils";
import { css } from "@emotion/css";
import FontSize from "@/consts/font";
import { AttachmentWrapper } from "../database";
import BorderInput from "@/components/base/BorderInput";
import Colors from "@/consts/colors";
import { DraggableElement } from "../global";
import { VideoToolbarStateAtom } from "./hooks/useVideoToolbarState";
import { useSetAtom } from "jotai";
import NameEditor from "./VideoNameEditor";
import Select from "@/components/base/select";
import { VideoSidebarStateAtom } from "./hooks/useVideoSidebarState";
import { useTranslation } from "react-i18next";
import LabelActionMenu from "../database/LabelActionMenu";

const VideoLabelController = () => {
  const setSidebarState = useSetAtom(VideoSidebarStateAtom);
  const labelIds = useSelectAtomValue(VideoStateAtom, (s) => s.labels);
  const [sortedLabels, setSortedLabels] = useState<number[]>();
  const [sortMode, setSortMode] = useState<"createTime" | "videoTime">(
    "videoTime"
  );
  useEffect(() => {
    const action = async () => {
      if (sortMode === "videoTime") {
        const labels = (
          await Promise.all(
            labelIds?.map((i) => ObjectStore("videoLabel").getOneById(i)) || []
          )
        ).filter((i) => i) as IVideoLabel[];
        labels.sort((b, a) => b.videoTime - a.videoTime);
        setSortedLabels(labels.map((i) => i.id));
      } else {
        const labels = (
          await Promise.all(
            labelIds?.map((i) => ObjectStore("videoLabel").getOneById(i)) || []
          )
        ).filter((i) => i) as IVideoLabel[];
        labels.sort((b, a) => b.createdAt - a.createdAt);
        setSortedLabels(labels.map((i) => i.id));
      }
    };
    action();
  }, [labelIds, sortMode]);
  const { t } = useTranslation();
  return (
    <Content
      flex
      column
      style={{
        border: `1px solid ${Colors.Background.Border}`,
        borderRadius: 10,
        overflow: "hidden",
        maxHeight: "100%",
      }}
    >
      <Content
        style={{
          padding: "6px 20px 6px 16px",
          background: Colors.Background.ButtonHover,
        }}
        flex
        fullWidth
        alignItems="center"
        justifyContent="space-between"
      >
        <div className={ClassName.title(FontSize["18px"])}>
          {t("general.labels")}
        </div>
        <Content flex gap={8}>
          <Select
            closeOnSelect
            value={sortMode}
            className={ClassName.description()}
            onSelect={(v) => typeof v[0] === "string" && setSortMode(v[0])}
            options={[
              {
                value: "videoTime",
                children: t("general.sort by video time"),
              },
              {
                value: "createTime",
                children: t("general.sort by create time"),
              },
            ]}
          ></Select>
          <Icon
            name="park-close"
            className={ClassName.circleButton()}
            onClick={() =>
              setSidebarState((s) => ({ ...s, showLabels: false }))
            }
          ></Icon>
        </Content>
      </Content>
      <Content
        flex
        column
        style={{
          padding: "4px 12px 4px 8px",
          overflowY: "auto",
          height: "100%",
        }}
        className={css({
          ">": {
            ":not(:last-child)": {
              borderBottom: `1px solid ${Colors.Background.Border}`,
            },
          },
        })}
      >
        {sortedLabels?.map((i) => (
          <Label id={i} key={i} />
        ))}
      </Content>
    </Content>
  );
};

const Label = ({ id }: { id: number }) => {
  const label = ObjectStore("videoLabel").useValue(id);
  const instance = useVideoInstance();
  const sortedChapters = useSelectAtomValue(
    VideoStateAtom,
    (s) => s.sortedChapters
  );
  const currentFocusLabelId = useSelectAtomValue(
    VideoToolbarStateAtom,
    (s) => s.currentFocusLabelId
  );
  const containerRef = useRef<HTMLElement>(null);
  const setToolbarState = useSetAtom(VideoToolbarStateAtom);
  const labelMeta = MetaStore.useObjectToMetaValue(id);
  const { t } = useTranslation();
  useEffect(() => {
    if (id === currentFocusLabelId) {
      const container = containerRef.current;
      if (container) {
        container.scrollIntoView({ block: "center" });
        container.style.borderRadius = "8px";
        container.style.outline = `1px solid ${Colors.Emphasis.Emphasis}`;
        setTimeout(() => {
          setToolbarState((s) => ({ ...s, currentFocusLabelId: undefined }));
          container.style.removeProperty("outline");
          container.style.removeProperty("border-radius");
        }, 1500);
      }
    }
  }, [currentFocusLabelId]);
  const [labelState, setLabelState] = useState<{
    addingAttachment: boolean;
    addingDescription: boolean;
    focused: boolean;
    editingName: boolean;
  }>({
    focused: false,
    editingName: false,
    addingDescription: false,
    addingAttachment: false,
  });
  useEffect(() => {
    if (labelState.addingAttachment) {
      const existMeta = MetaStore.getMetaObjectByObjectId(id);
      if (!existMeta) {
        MetaStore.addObjectAsMeta({
          type: "videoLabel",
          objectId: id,
          name: label?.name,
        });
      }
    }
  }, [labelState.addingAttachment]);

  if (!label) return null;
  const chapter = sortedChapters?.findLast(
    (i) => i.startTime < label.videoTime
  );
  return (
    <Content ref={containerRef} flex column gap={8} style={{ padding: 10 }}>
      <Content flex gap={12} alignItems="center">
        {label?.imageUrl && (
          <Image
            width={100}
            preview
            ratio={0.5625}
            containerStyle={{
              borderRadius: 8,
            }}
            src={label?.imageUrl}
          ></Image>
        )}
        <Content flex column auto>
          {labelState.editingName ? (
            <NameEditor
              value={label.name}
              onChange={(v) => {
                ObjectStore("videoLabel").updateOne({ id: id, name: v });
                setLabelState((s) => ({ ...s, editingName: false }));
              }}
            />
          ) : (
            <DraggableElement
              draggingDetails={{
                type: "videoLabel",
                id: id,
                videoTime: label.videoTime,
                imageUrl: label.imageUrl,
                parentObjectId: instance.getVideoId?.(),
              }}
            >
              <div
                onClick={() => {
                  instance.jumpTo?.(label?.videoTime);
                  instance.closeThumbnail?.();
                }}
                className={css([
                  ClassName.ellipsisFont(2),
                  ClassName.title(FontSize["14px"]),
                ])}
                style={{ cursor: "pointer", width: "fit-content" }}
              >
                {label?.name || "Unnamed Label"}
              </div>
            </DraggableElement>
          )}
          <div
            style={{ flexShrink: 0 }}
            className={ClassName.description(FontSize["11px"])}
          >
            {`${normalizeSecondsToTime(label?.videoTime)}${
              chapter ? "  ——  " + chapter?.name : ""
            }`}
          </div>
        </Content>
        <IconWithPopover
          name="park-more"
          className={ClassName.circleButton()}
          closeOnContentClick="[role='button']"
          placement={["right", "left"]}
          content={
            <LabelActionMenu
              on={(event) => {
                switch (event.type) {
                  case "addAttachment":
                    setLabelState((s) => ({ ...s, addingAttachment: true }));
                    break;
                  case "addDescription":
                    setLabelState((s) => ({
                      ...s,
                      addingDescription: !s.addingDescription,
                    }));
                    break;
                  case "delete":
                    instance.deleteLabel?.(id);
                    break;
                  case "changeName":
                    setLabelState((s) => ({ ...s, editingName: true }));
                    break;
                }
              }}
              objectId={label.id}
              type="videoLabel"
            />
          }
        ></IconWithPopover>
      </Content>
      {label.description && !labelState.addingDescription && (
        <div
          style={{
            whiteSpace: "pre-wrap",
            textTransform: "none",
            wordBreak: "break-all",
          }}
          className={ClassName.description(FontSize["12px"])}
        >
          {label.description}
        </div>
      )}
      {labelState.addingDescription && (
        <BorderInput
          textarea
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          placeholder={t("general.edit description")}
          defaultValue={label.description}
          withSubmit
          onSubmit={() =>
            setLabelState((s) => ({ ...s, addingDescription: false }))
          }
          onChange={(e) =>
            ObjectStore("videoLabel").updateOne({ id, description: e })
          }
        />
      )}
      {labelMeta?.attachments?.length ||
      (labelState.addingAttachment && labelMeta) ? (
        <AttachmentWrapper
          style={{ marginTop: 4 }}
          metaId={labelMeta.id}
          visible
          closeIcon={
            labelState.addingAttachment && !labelMeta.attachments?.length
          }
          onClose={() =>
            setLabelState((s) => ({ ...s, addingAttachment: false }))
          }
          onAttachmentsChange={(atts) =>
            MetaStore.updateMetaObject(
              { id: labelMeta.id, attachments: atts },
              true
            )
          }
          attachments={labelMeta?.attachments}
        />
      ) : null}
    </Content>
  );
};
export default VideoLabelController;
