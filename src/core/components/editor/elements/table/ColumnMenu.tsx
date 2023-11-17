import { Content, IconButton, Switch, WithBorder } from "@/components/base";
import ClassName from "@/styles/classNames";
import { useTranslation } from "react-i18next";

const ColumnMenu = ({
  on,
  isHeader,
  showHeader,
}: {
  on: (
    type:
      | "headerColumn"
      | "insertLeft"
      | "insertRight"
      | "delete"
      | "clearContent"
  ) => void;
  showHeader: boolean;
  isHeader: boolean;
}) => {
  const { t } = useTranslation();
  const buttons: Parameters<typeof IconButton>[0][] = [
    {
      icon: "park-left",
      onClick: () => on("insertLeft"),
      text: t("editor.insert column left"),
    },
    {
      icon: "park-right",
      onClick: () => on("insertRight"),
      text: t("editor.insert column right"),
    },
    {
      icon: "park-close",
      onClick: () => on("clearContent"),
      text: t("editor.clear column content"),
    },
    {
      icon: "park-delete",
      onClick: () => on("delete"),
      text: t("general.delete"),
      dangerous: true,
    },
  ];
  return (
    <WithBorder style={{ padding: 4, width: 200 }}>
      {showHeader && (
        <Content
          flex
          gap={4}
          justifyContent="space-between"
          onClick={() => on("headerColumn")}
          className={ClassName.flatButton()}
        >
          <div>{t("editor.header column")}</div>
          <Switch value={isHeader} />
        </Content>
      )}
      {buttons.map((i) => (
        <IconButton {...i} key={i.icon} />
      ))}
    </WithBorder>
  );
};

export default ColumnMenu;
