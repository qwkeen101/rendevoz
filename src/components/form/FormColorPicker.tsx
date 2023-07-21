import ClassName from "@/styles/classNames";
import { useTranslation } from "react-i18next";
import { Icon } from "..";
import ColorPicker from "../picker/colorPicker";

const FormColorPicker = ({
  onPick,
  onClose,
  disableLinear,
}: {
  onPick: (e: string) => void;
  onClose: VoidFunction;
  disableLinear?: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <div style={{ width: 400 }}>
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          textTransform: "capitalize",
        }}
        className={ClassName.description()}
      >
        {`${t("general.choose")} ${t("general.color")}`}
        <Icon
          name="park-close"
          onClick={onClose}
          className={ClassName.circleButton()}
        />
      </div>
      <ColorPicker disableLinear={disableLinear} onPick={onPick} />
    </div>
  );
};

export default FormColorPicker;
