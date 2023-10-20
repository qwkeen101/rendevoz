import ClassName from "@/styles/classNames";
import produce from "immer";
import { useTranslation } from "react-i18next";
import { Switch } from "../../components/base";
import SettingItem from "./SettingItem";
import { IObjectsAndLinkSetting, useSetting } from ".";

const ObjectsAndLinksSetting = () => {
  const { t } = useTranslation();
  const [setting, setSetting] = useSetting();
  const toggleSetting = (
    key: keyof IObjectsAndLinkSetting["objectAndLink"]
  ) => {
    if (
      (key !== "enableAll" && setting.objectAndLink.enableAll) ||
      key === "enableAll"
    ) {
      setSetting((s) =>
        produce(s, (draft) => {
          draft.objectAndLink[key] = !draft.objectAndLink[key];
        })
      );
    }
  };
  const {
    enableAll,
    enableDropOnEditorLink,
    enableDropOnPDFLink,
    enableDropOnWhiteboardLink,
    enableDragFromEditorLink,
    enableDragFromPDFLink,
    enableDropAutoGenerateObject,
  } = setting.objectAndLink;
  const linkSettingItems: SettingItem[] = [
    {
      title: t("settings.enable auto add link"),
      children: (
        <Switch value={enableAll} onChange={() => toggleSetting("enableAll")} />
      ),
    },
    {
      title: t("settings.enable drag from pdf add link"),
      children: (
        <Switch
          value={enableAll && enableDragFromPDFLink}
          onChange={() => toggleSetting("enableDragFromPDFLink")}
        />
      ),
    },
    {
      title: t("settings.enable drag from editor add link"),
      children: (
        <Switch
          value={enableAll && enableDragFromEditorLink}
          onChange={() => toggleSetting("enableDragFromEditorLink")}
        />
      ),
    },
    {
      title: t("settings.enable drop on pdf add link"),
      children: (
        <Switch
          value={enableAll && enableDropOnPDFLink}
          onChange={() => toggleSetting("enableDropOnPDFLink")}
        />
      ),
    },
    {
      title: t("settings.enable drop on editor add link"),
      children: (
        <Switch
          value={enableAll && enableDropOnEditorLink}
          onChange={() => toggleSetting("enableDropOnEditorLink")}
        />
      ),
    },
    {
      title: t("settings.enable drop on whiteboard add link"),
      children: (
        <Switch
          value={enableAll && enableDropOnWhiteboardLink}
          onChange={() => toggleSetting("enableDropOnWhiteboardLink")}
        />
      ),
    },
  ];
  const objectSettingItems: SettingItem[] = [
    {
      title: t("settings.enable drop auto generate object"),
      children: (
        <Switch
          value={enableDropAutoGenerateObject}
          onChange={() => toggleSetting("enableDropAutoGenerateObject")}
        />
      ),
    },
  ];
  return (
    <>
      <div className={ClassName.title("18px")}>
        {t("settings.link settings")}
      </div>
      {linkSettingItems.map((i) => (
        <SettingItem titleSize={14} key={i.title} {...i} />
      ))}
      <div className={ClassName.title("18px")}>
        {t("settings.object settings")}
      </div>
      {objectSettingItems.map((i) => (
        <SettingItem titleSize={14} key={i.title} {...i} />
      ))}
    </>
  );
};

export default ObjectsAndLinksSetting;
