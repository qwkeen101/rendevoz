import { useGlobalAtomValue } from "@/hooks";
import { GlobalScreenShotOcrResult } from ".";
import { Button, Content, Icon } from "@/components";
import Colors from "@/consts/colors";
import ClassName from "@/styles/classNames";
import { useTranslation } from "react-i18next";
import { Rendevoz } from "@/core/rendevoz";

const ScreenShotOcr = ({
  draggable,
  onToggleDraggable,
}: {
  draggable: boolean;
  onToggleDraggable: VoidFunction;
}) => {
  const ocrResult = useGlobalAtomValue(GlobalScreenShotOcrResult);
  const { t } = useTranslation();

  const renderContent = () => {
    if (ocrResult === "loading") {
      return (
        <Content flex gap={16}>
          <Icon name="park-loading-four" spin size={18} />
          <div>{t("general.loading")}...</div>
        </Content>
      );
    }

    if (ocrResult === undefined) {
      return <div>No Image</div>;
    }
    return ocrResult;
  };
  return (
    <Content
      flex
      centered
      column
      gap={6}
      style={{
        padding: "4px 12px",
        borderRadius: 8,
        width: "max-content",
        maxWidth: 500,
        userSelect: draggable ? "none" : "text",
        textTransform: "none",
        background: Colors.Background.ButtonHover,
      }}
    >
      {ocrResult && ocrResult !== "loading" && (
        <Content flex column fullWidth gap={6}>
          <div className={ClassName.title("1rem")}>
            {t("general.text recognition result")}
          </div>
          <Content fullWidth flex gap={6}>
            <Button.IconButton
              icon="park-move-one"
              selected={draggable}
              onClick={onToggleDraggable}
              text={t("general.move")}
            />
            {ocrResult && (
              <Button.IconButton
                onClick={(e) => {
                  Rendevoz.Actions.Open.Translate.openTranslate({
                    e,
                    query: ocrResult,
                  });
                }}
                icon={"park-translate"}
                text={t("general.translate")}
              />
            )}
            <Button.IconButton
              icon="park-copy"
              text={t("general.copy")}
              onClick={() => {
                ocrResult && navigator.clipboard.writeText(ocrResult);
              }}
            />
          </Content>
        </Content>
      )}
      {renderContent()}
    </Content>
  );
};

export default ScreenShotOcr;
