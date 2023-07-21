import { ColorPicker, Content, WithBorder } from "@/components";
import { useToggle } from "@/hooks";
import ClassName from "@/styles/classNames";
import { css } from "@emotion/css";
import { useTranslation } from "react-i18next";

type PickColorFunc = (color: string) => void;
const BlockColorPicker = ({
  onPickFontColor,
  onPickBackgroundColor,
  showBg = true,
  showFont = true,
  fontBackDefault = true,
  bgBackDefault = true,
  borderBackDefault = true,
  showMoreBg,
  showMoreFont,
  showMoreBgOption,
  showMoreFontOption,
  showBorder,
  onPickBorderColor,
}: {
  onPickFontColor?: PickColorFunc;
  onPickBackgroundColor?: PickColorFunc;
  onPickBorderColor?: PickColorFunc;
  showBg?: boolean;
  showFont?: boolean;
  showBorder?: boolean;
  fontBackDefault?: boolean;
  bgBackDefault?: boolean;
  borderBackDefault?: boolean;
  showMoreBg?: boolean;
  showMoreFont?: boolean;
  showMoreFontOption?: boolean;
  showMoreBgOption?: boolean;
}) => {
  const [showMoreColor, toggleShowMoreFontColor] = useToggle(false);
  const [showMoreBackground, toggleShowMoreBackground] = useToggle(false);
  const { t } = useTranslation();
  return (
    <WithBorder
      className={css({
        padding: 6,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        "> div": {
          width: 275,
        },
      })}
    >
      {showFont && (
        <>
          <Content
            flex
            alignItems="center"
            justifyContent="space-between"
            className={ClassName.description()}
          >
            <span>{t("editor.font color")}</span>
            {showMoreFontOption && (
              <span
                onClick={toggleShowMoreFontColor}
                className={ClassName.flatButton(3, "0px 3px")}
              >
                {showMoreColor ? t("editor.show less") : t("editor.show more")}
              </span>
            )}
          </Content>
          <ColorPicker
            enableDefault={fontBackDefault}
            isFont
            enableMore={!showMoreColor && !showMoreFont}
            onPick={onPickFontColor}
          />
        </>
      )}
      {showBorder && (
        <>
          <Content
            flex
            alignItems="center"
            justifyContent="space-between"
            className={ClassName.description()}
          >
            <span>{t("editor.border color")}</span>
          </Content>
          <ColorPicker
            enableDefault={borderBackDefault}
            enableMore={true}
            onPick={onPickBorderColor}
          />
        </>
      )}
      {showBg && (
        <>
          <Content
            flex
            alignItems="center"
            justifyContent="space-between"
            className={ClassName.description()}
          >
            <span>{t("editor.background color")}</span>
            {showMoreBgOption && (
              <span
                onClick={toggleShowMoreBackground}
                className={ClassName.flatButton(3, "0px 3px")}
              >
                {showMoreBackground
                  ? t("editor.show less")
                  : t("editor.show more")}
              </span>
            )}
          </Content>
          <ColorPicker
            enableDefault={bgBackDefault}
            enableMore={!showMoreBackground && !showMoreBg}
            onPick={onPickBackgroundColor}
          />
        </>
      )}
    </WithBorder>
  );
};

export default BlockColorPicker;
