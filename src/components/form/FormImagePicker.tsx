import ClassName from "@/styles/classNames";
import { saveImageLocally } from "@/utils/img";
import { useTranslation } from "react-i18next";
import { Content, Icon, Image, Modal } from "../base";
import useFileUpload from "../base/useFileUpload";
import { useToggle } from "@/hooks";
import FormWebImagePicker from "./FormWebImagePicker";
import { css } from "@emotion/css";

const FormImagePicker = ({
  imageUrl,
  onChange,
  name,
}: {
  imageUrl?: string;
  onChange?: (v: string | undefined) => void;
  name: string;
}) => {
  const { upload, renderUploader } = useFileUpload((file) => {
    saveImageLocally(file).then((data) => {
      onChange?.(data);
    });
  }, "image/*");
  const { t } = useTranslation();
  const [webImagePickerVisible, toggleWebImagePickerVisible] = useToggle(false);
  return (
    <>
      {renderUploader()}
      <Modal
        showClose
        noStyle
        visible={webImagePickerVisible}
        onClose={toggleWebImagePickerVisible}
      >
        <FormWebImagePicker
          name={name}
          onPick={(url) => {
            onChange?.(url);
            console.log(url);
            toggleWebImagePickerVisible(false);
          }}
        />
      </Modal>
      <Content
        alignItems="center"
        justifyContent="space-between"
        flex
        gap={8}
        onClick={() => {
          if (imageUrl) {
            onChange?.(undefined);
          }
        }}
        className={ClassName.flatButton()}
      >
        <Content gap={8} flex style={{ textTransform: "capitalize" }}>
          {imageUrl ? (
            <>
              <Icon name="park-delete" />
              <span>{`${t("general.delete")} ${t("general.image")}`}</span>
            </>
          ) : (
            <>
              <Icon name="park-add-pic" />
              <div
                className={css({
                  ":hover": {
                    textDecoration: "underline",
                  },
                })}
                onClick={(e) => {
                  e.stopPropagation();
                  upload();
                }}
              >
                {t("general.upload image")}{" "}
              </div>
              <span>{t("general.or")} </span>
              <div
                className={css({
                  ":hover": {
                    textDecoration: "underline",
                  },
                })}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWebImagePickerVisible();
                }}
              >
                {t("general.pick image from internet")}
              </div>
            </>
          )}
        </Content>
        {imageUrl && (
          <Content
            flex
            centered
            style={{
              width: 20,
              height: 20,
              flexShrink: 0,
            }}
          >
            <Image src={imageUrl} style={{ borderRadius: 6 }} width="100%" />
          </Content>
        )}
      </Content>
    </>
  );
};

export default FormImagePicker;
