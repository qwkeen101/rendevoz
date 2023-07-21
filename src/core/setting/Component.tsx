import ClassName from "@/styles/classNames";
import produce from "immer";
import { useTranslation } from "react-i18next";
import { AnimatePopover, Button, Content, Switch } from "../../components/base";
import SettingItem from "./Item";
import { IComponentSetting, useSetting } from ".";
import Select from "@/components/base/select";
import { ChromePicker } from "react-color";
import { useEffect, useRef } from "react";
import { useUpdate } from "react-use";

const ComponentSetting = () => {
  const { t } = useTranslation();
  const [setting, setSetting] = useSetting();
  const toggleSetting = (
    key: keyof IComponentSetting,
    v: keyof IComponentSetting[keyof IComponentSetting]
  ) => {
    setSetting((s) =>
      produce(s, (draft) => {
        draft[key][v] = !draft[key][v];
      })
    );
  };

  const whiteboardSettingItems: SettingItem[] = [
    {
      title: t("settings.enable whiteboard minimap"),
      children: (
        <Switch
          value={setting.whiteboard.enableMinimap}
          onChange={() => toggleSetting("whiteboard", "enableMinimap")}
        />
      ),
    },
    {
      title: t("settings.enable add link between objects when connect"),
      children: (
        <Switch
          value={setting.whiteboard.enableAddLinkBetweenObjectsWhenConnect}
          onChange={() =>
            toggleSetting(
              "whiteboard",
              "enableAddLinkBetweenObjectsWhenConnect"
            )
          }
        />
      ),
    },
  ];

  const editorSettingItems: SettingItem[] = [
    {
      title: t("settings.object auto become inline when dragged into editor"),
      children: (
        <Switch
          value={setting.editor.objectAutoBecomeInline}
          onChange={() => toggleSetting("editor", "objectAutoBecomeInline")}
        />
      ),
    },
  ];
  const translateSettingItems: SettingItem[] = [
    {
      title: t("settings.auto go to translate original text"),
      children: (
        <Switch
          value={setting.translate.autoGotoHoverText}
          onChange={() => toggleSetting("translate", "autoGotoHoverText")}
        />
      ),
    },
    {
      title: t("settings.show original text when hover on text"),
      children: (
        <Switch
          value={setting.translate.showOrigWhenHoverText}
          onChange={() => toggleSetting("translate", "showOrigWhenHoverText")}
        />
      ),
    },
  ];

  const containerRef = useRef<HTMLDivElement>(null);

  const update = useUpdate();

  useEffect(() => {
    if (setting.pdf.renderMode === "custom") {
      update();
    }
  }, [setting.pdf.renderMode]);
  const pdfSettingItems: (SettingItem | undefined)[] = [
    {
      title: t("settings.pdf render mode"),
      children: (
        <Select
          closeOnSelect
          value={setting.pdf.renderMode}
          options={[
            { value: "default", children: t("settings.default") },
            { value: "followTheme", children: t("settings.follow theme") },
            { value: "custom", children: t("settings.custom") },
          ]}
          onSelect={(v) => {
            if (typeof v[0] === "string") {
              setSetting((s) =>
                produce(s, (s) => {
                  s.pdf.renderMode = v[0];
                })
              );
            }
          }}
        />
      ),
    },
    setting.pdf.renderMode === "custom"
      ? {
          title: t("settings.customize render mode"),
          // column: true,
          children: (
            <Content ref={containerRef} flex alignItems="center" gap={15}>
              <AnimatePopover
                padding={10}
                parentElement={containerRef.current}
                content={
                  <ChromePicker
                    disableAlpha
                    color={setting.pdf.customRenderBackground}
                    onChange={(v) => {
                      setSetting((s) =>
                        produce(s, (g) => {
                          g.pdf.customRenderBackground = v.hex;
                        })
                      );
                    }}
                  />
                }
              >
                <Content flex gap={6} alignItems="center">
                  <Button.IconButton
                    text={t("settings.pdf background color")}
                  />
                  {setting.pdf.customRenderBackground && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        background: setting.pdf.customRenderBackground,
                        borderRadius: 4,
                      }}
                    ></div>
                  )}
                </Content>
              </AnimatePopover>
              <AnimatePopover
                padding={10}
                parentElement={containerRef.current}
                content={
                  <ChromePicker
                    disableAlpha
                    color={setting.pdf.customRenderFont}
                    onChange={(v) => {
                      setSetting((s) =>
                        produce(s, (g) => {
                          g.pdf.customRenderFont = v.hex;
                        })
                      );
                    }}
                  />
                }
              >
                <Content flex gap={6} alignItems="center">
                  <Button.IconButton text={t("settings.pdf font color")} />
                  {setting.pdf.customRenderFont && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        background: setting.pdf.customRenderFont,
                        borderRadius: 4,
                      }}
                    ></div>
                  )}
                </Content>
              </AnimatePopover>
            </Content>
          ),
        }
      : undefined,
  ];

  const webpageSettingItems: SettingItem[] = [
    {
      title: t("settings.enable search auto suggestion"),
      children: (
        <Switch
          value={setting.webpage.enableSearchAutoSuggestion}
          onChange={() =>
            toggleSetting("webpage", "enableSearchAutoSuggestion")
          }
        />
      ),
    },
  ];
  return (
    <>
      <div className={ClassName.title("18px")}>
        {t("settings.whiteboard settings")}
      </div>
      {whiteboardSettingItems.map((i) => (
        <SettingItem titleSize={14} key={i.title} {...i} />
      ))}
      <div className={ClassName.title("18px")} style={{ marginTop: 10 }}>
        {t("settings.editor settings")}
      </div>
      {editorSettingItems.map((i) => (
        <SettingItem titleSize={14} key={i.title} {...i} />
      ))}
      <div className={ClassName.title("18px")} style={{ marginTop: 10 }}>
        {t("settings.translate settings")}
      </div>
      {translateSettingItems.map((i) => (
        <SettingItem titleSize={14} key={i.title} {...i} />
      ))}
      <div className={ClassName.title("18px")} style={{ marginTop: 10 }}>
        {t("settings.webpage settings")}
      </div>
      {webpageSettingItems.map((i) => (
        <SettingItem titleSize={14} key={i.title} {...i} />
      ))}
      <div className={ClassName.title("18px")} style={{ marginTop: 10 }}>
        {t("settings.pdf settings")}
      </div>
      {pdfSettingItems.map(
        (i) => i && <SettingItem titleSize={14} key={i.title} {...i} />
      )}
    </>
  );
};

export default ComponentSetting;
