import { AnimatePopover, Content, Icon, WithBorder } from "@/components/base";
import { ReactEditor } from "@/core";
import { CustomEditor } from "~/typings";
import moveSingleElement from "@/core/editor/utils/moveSingleElement";
import ClassName from "@/styles/classNames";
import { useRef, useState } from "react";
import { Transforms } from "slate";
import { EditorOverlayManager } from "../useEditorOverlay";
import BlockColorPicker from "../../BlockColorPicker";
import { useTranslation } from "react-i18next";
import { defaultBgColor } from "@/components/picker/colorPicker";

const EditorBlockDetails = ({
  editor,
  manager,
}: {
  editor: CustomEditor;
  manager: EditorOverlayManager;
}) => {
  const [styleVisible, setStyleVisible] = useState(false);
  const [formatVisible, setFormatVisible] = useState(false);
  const { t } = useTranslation();
  const currentEle = editor.currentAddClickElement;
  const currentElePath = ReactEditor.findPath(editor, currentEle);
  const containerRef = useRef<HTMLDivElement>(null);

  let showColor = true;
  let showBorderColor = false;
  if (currentEle) {
    switch (currentEle.type) {
      case "code-block":
        showColor = false;
        break;
      case "highlight-block":
        showBorderColor = true;
    }
  }

  return (
    <WithBorder
      ref={containerRef}
      style={{ padding: 3, minWidth: 220, userSelect: "none" }}
    >
      {/* {currentEle?.type === 'metaObject' && (
        <Button.IconButton
          icon="park-text-rotation-none"
          text={t('editor.make object inline')}
          onClick={() => {
            Transforms.removeNodes(editor, { at: currentElePath })
            Transforms.insertNodes(
              editor,
              {
                type: 'paragraph',
                id: Id.getId(),
                children: [
                  {
                    type: 'inline-metaObject',
                    originId: currentEle.originId,
                    children: [{ text: '' }],
                    id: Id.getId()
                  }
                ]
              },
              { at: currentElePath }
            )
          }}
        />
      )} */}
      <AnimatePopover
        containerStyle={{ zIndex: "10000" }}
        positions={["right"]}
        align="start"
        visible={formatVisible}
        parentElement={containerRef.current || document.body}
        disableIntersection
        disableNudge
        onClickOutside={() => setFormatVisible(false)}
        content={
          <WithBorder
            style={{ padding: 3, width: 130 }}
            onClick={(e) => {
              if (e.target !== e.currentTarget) {
                setFormatVisible(false);
              }
            }}
          >
            <div
              onClick={() => {
                Transforms.setNodes(
                  editor,
                  { align: "left" },
                  { at: currentElePath }
                );
              }}
              className={ClassName.flatButton()}
            >
              {t("editor.align left")}
            </div>
            <div
              onClick={() => {
                Transforms.setNodes(
                  editor,
                  { align: "center" },
                  { at: currentElePath }
                );
              }}
              className={ClassName.flatButton()}
            >
              {t("editor.align center")}
            </div>
            <div
              onClick={() => {
                Transforms.setNodes(
                  editor,
                  { align: "right" },
                  { at: currentElePath }
                );
              }}
              className={ClassName.flatButton()}
            >
              {t("editor.align right")}
            </div>
          </WithBorder>
        }
      >
        <Content
          flex
          alignItems="center"
          justifyContent="space-between"
          className={ClassName.flatButton()}
          onClick={() => setFormatVisible(!formatVisible)}
        >
          <Content flex centered gap={10}>
            <Icon name="park-align-text-left" size={18} />
            {t("editor.text alignment")}
          </Content>
          <Icon name="park-right" />
        </Content>
      </AnimatePopover>
      {showColor && (
        <AnimatePopover
          containerStyle={{ zIndex: "10000" }}
          positions={["bottom", "top"]}
          align="end"
          visible={styleVisible}
          parentElement={containerRef.current || document.body}
          disableIntersection
          reposition
          onClickOutside={() => setStyleVisible(false)}
          content={
            <BlockColorPicker
              showMoreFontOption
              showMoreBgOption
              showBorder={showBorderColor}
              onPickBorderColor={(c) => {
                Transforms.setNodes(
                  editor,
                  {
                    borderColor: c === defaultBgColor ? undefined : c,
                  },
                  {
                    at: currentElePath,
                  }
                );
              }}
              onPickFontColor={(c) => {
                Transforms.setNodes(
                  editor,
                  {
                    color: c === "#000000" ? undefined : c,
                  },
                  {
                    at: currentElePath,
                  }
                );
              }}
              onPickBackgroundColor={(c) => {
                Transforms.setNodes(
                  editor,
                  {
                    background: c === "#ffffff" ? undefined : c,
                  },
                  {
                    at: currentElePath,
                  }
                );
              }}
            />
          }
        >
          <Content
            flex
            justifyContent="space-between"
            alignItems="center"
            className={ClassName.flatButton()}
            onClick={() => setStyleVisible(!styleVisible)}
          >
            <Content flex centered gap={10}>
              <Icon name="park-platte" size={18} />
              {t("general.color")}
            </Content>
            <Icon name="park-right" />
          </Content>
        </AnimatePopover>
      )}
      <Content
        flex
        gap={10}
        alignItems="center"
        className={ClassName.flatButton()}
        onClick={() => {
          if (currentEle) {
            editor.currentCopyElement = currentEle;
          }
          manager.close();
        }}
      >
        <Icon name="park-copy" size={18} />
        {t("general.copy")}
      </Content>
      <Content
        flex
        gap={10}
        alignItems="center"
        className={ClassName.flatButton()}
        onClick={() => {
          moveSingleElement(editor, currentElePath, [0], "top", false);
          Transforms.removeNodes(editor, { at: [0] });
          manager.close();
        }}
      >
        <Icon name="park-delete" size={18} />
        {t("general.delete")}
      </Content>
    </WithBorder>
  );
};
export default EditorBlockDetails;
