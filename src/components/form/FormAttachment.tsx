import { AttachmentList } from "@/core";
import { useEffect, useRef } from "react";
import { IMetaAttachment, MetaObject } from "~/typings";
import { Content, Icon } from "../base";
import ClassName from "@/styles/classNames";
import { useTranslation } from "react-i18next";
import { groupClassName, hoverLabelClassName } from "./useFlipForm";

export const FormAttachmentManager = ({
  attachments,
  onAttachmentsChange,
  onClose,
  metaId,
}: {
  onClose: VoidFunction;
  attachments: MetaObject["attachments"];
  onAttachmentsChange: (atts?: IMetaAttachment[]) => void;
  metaId: number;
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const containerModal = containerRef.current?.closest(
      "[role='modal-container']"
    );
    if (containerModal) {
      const currentZindex = containerModal.style.zIndex;
      containerModal.style.zIndex = "10000";
      return () => {
        containerModal.style.zIndex = currentZindex;
      };
    }
  }, []);
  return (
    <Content
      flex
      ref={containerRef}
      column
      style={{
        minWidth: 300,
        maxWidth: 500,
      }}
    >
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginLeft: 8,
          marginRight: -4,
          textTransform: "capitalize",
        }}
        className={ClassName.description()}
      >
        {t("general.manage attachments")}
        <Icon
          name="park-close"
          onClick={onClose}
          className={ClassName.circleButton()}
        />
      </div>
      <div
        style={{ height: 0, flex: 1, display: "flex", flexDirection: "column" }}
      >
        <AttachmentList
          parentMetaId={metaId}
          style={{ flex: 1 }}
          innerContainerStyle={{
            justifyContent: "space-between",
            minHeight: 200,
            maxHeight: "60vh",
            overflowY: "auto",
          }}
          maxVisibleAttachments={99999}
          onAttachmentsChange={onAttachmentsChange}
          attachments={attachments}
        ></AttachmentList>
      </div>
    </Content>
  );
};
export const FormAttachmentDisplayer = ({ length }: { length: number }) => {
  const { t } = useTranslation();
  return (
    <div className={groupClassName}>
      <div className={hoverLabelClassName}>{t("general.attachments")}</div>
      <div>{length} attachments</div>
    </div>
  );
};
