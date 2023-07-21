import { css } from "@emotion/css";
import { MouseEventHandler, ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Content, Icon, Menu, Tooltip } from "@/components";
import FontSize from "@/consts/font";
import { EditorTypeToElementMap } from "../maps";
import { RegisterdEditorElement } from "~/typings";
import ClassName from "@/styles/classNames";

const EditorElementsMenu = (props: {
  onAddElement: (blockName: string) => void;
}) => {
  const { onAddElement } = props;
  const { t } = useTranslation();
  const { block, basic, inline, media } = useMemo(() => {
    const basic: RegisterdEditorElement[] = [],
      inline: RegisterdEditorElement[] = [],
      block: RegisterdEditorElement[] = [],
      media: RegisterdEditorElement[] = [];

    EditorTypeToElementMap.forEach((item) => {
      if (item.registerInMenu?.addMenu) {
        switch (item.registerInMenu.menuType) {
          case "basic":
            basic.push(item);
            break;
          case "block":
            block.push(item);
            break;
          case "inline":
            inline.push(item);
            break;
          case "media":
            media.push(item);
            break;
        }
      }
    });
    return {
      block,
      basic,
      inline,
      media,
    };
  }, []);
  return (
    <Content
      column
      flex
      style={{
        padding: "8px 12px",
      }}
    >
      <Title>{t("editor.basic")}</Title>
      <Content
        className={css({
          gap: 10,
          display: "grid !important",
          gridTemplateColumns: "repeat(6,24px)",
          justifyContent: "space-between",
        })}
      >
        {basic.map((b) => (
          <IconItem
            key={b.type}
            onClick={() => onAddElement(b.type)}
            tooltip={b.registerInMenu?.tooltip}
            icon={b.registerInMenu?.icon}
          />
        ))}
      </Content>
      <Title>{t("editor.inline")}</Title>
      {inline.map((i) => (
        <Item
          key={i.type}
          onClick={() => onAddElement(i.type)}
          {...i}
          tooltip={i.registerInMenu?.tooltip}
          icon={i.registerInMenu?.icon}
        />
      ))}
      <Title>{t("editor.block")}</Title>
      {block.map((i) => (
        <Item
          key={i.type}
          onClick={() => onAddElement(i.type)}
          {...i}
          tooltip={i.registerInMenu?.tooltip}
          icon={i.registerInMenu?.icon}
        />
      ))}
      <Title>{t("editor.media")}</Title>
      {media.map((i) => (
        <Item
          key={i.type}
          onClick={() => onAddElement(i.type)}
          {...i}
          tooltip={i.registerInMenu?.tooltip}
          icon={i.registerInMenu?.icon}
        />
      ))}
    </Content>
  );
};
type LayoutItem = Parameters<typeof Menu.NavigationMenu>[0]["layout"][0];
export const EditorSlashElementsMenu: typeof EditorElementsMenu = ({
  onAddElement,
}) => {
  const { t } = useTranslation();
  const { basic, block, inline, media } = useMemo(() => {
    const values = Array.from(EditorTypeToElementMap.values()).filter(
      (i) => i.registerInMenu?.slashMenu
    );
    const basic: RegisterdEditorElement[] = [],
      block: RegisterdEditorElement[] = [],
      inline: RegisterdEditorElement[] = [],
      media: RegisterdEditorElement[] = [];
    values.forEach((i) => {
      switch (i.registerInMenu?.menuType) {
        case "basic":
          basic.push(i);
          break;
        case "block":
          block.push(i);
          break;
        case "inline":
          inline.push(i);
          break;
        case "media":
          media.push(i);
      }
    });
    return {
      basic,
      block,
      inline,
      media,
    };
  }, []);
  return (
    <Menu.NavigationMenu
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 10,
        maxHeight: 480,
        overflowY: "auto",
        width: 220,
      }}
      onClick={(name) => onAddElement(name)}
      layout={[
        {
          type: "custom",
          children: <Title>{t("editor.basic")}</Title>,
        },
        ...basic.map(
          (b) =>
            ({
              type: "item",
              icon: b.registerInMenu!.icon,
              text: b.name,
              name: b.type,
            } as LayoutItem)
        ),
        {
          type: "custom",
          children: <Title>{t("editor.inline")}</Title>,
        },
        ...inline.map(
          (i) =>
            ({
              type: "item",
              icon: i.registerInMenu!.icon,
              text: i.name,
              name: i.type,
            } as LayoutItem)
        ),
        {
          type: "custom",
          children: <Title>{t("editor.block")}</Title>,
        },
        ...block.map(
          (i) =>
            ({
              type: "item",
              icon: i.registerInMenu?.icon,
              text: i.name,
              name: i.type,
            } as LayoutItem)
        ),
        {
          type: "custom",
          children: <Title>{t("editor.media")}</Title>,
        },
        ...media.map(
          (i) =>
            ({
              type: "item",
              icon: i.registerInMenu?.icon,
              text: i.name,
              name: i.type,
            } as LayoutItem)
        ),
      ]}
    />
  );
};
const Title = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className={css({
        userSelect: "none",
        fontSize: FontSize["13px"],
        fontWeight: 600,
        marginBottom: 8,
        ":not(:first-child)": {
          marginTop: 8,
        },
      })}
    >
      {children}
    </div>
  );
};
const IconItem = ({
  icon,
  tooltip,
  onClick,
}: {
  icon?: string;
  tooltip?: string;
  iconColor?: string;
  onClick: MouseEventHandler;
}) => {
  if (!icon) return null;
  return (
    <Tooltip position="top" content={tooltip}>
      <Content onClick={onClick} className={ClassName.flatButton()}>
        <Icon name={icon} size={18} />
      </Content>
    </Tooltip>
  );
};
const Item = ({
  name,
  icon,
  onClick,
}: {
  name?: string | (() => string);
  icon?: string;
  tooltip?: string;
  iconColor?: string;
  onClick?: MouseEventHandler;
}) => {
  return (
    <Button.IconButton
      onClick={onClick}
      text={typeof name === "string" ? name : name?.()}
      icon={icon}
    />
  );
};
export default EditorElementsMenu;
