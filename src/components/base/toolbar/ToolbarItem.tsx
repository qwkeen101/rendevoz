import Icon from "@/components/base/Icon";
import classNames from "classnames";
import {
  cloneElement,
  createElement,
  CSSProperties,
  FC,
  MouseEventHandler,
  ReactNode,
} from "react";
import Tooltip from "../Tooltip";
import styles from "./index.module.less";
import ClassName from "@/styles/classNames";

interface ToolbarItemProps {
  onClick?: MouseEventHandler;
  className?: string;
  title?: string;
  size?: number;
  iconClassName?: string;
  children?: ReactNode;
  style?: CSSProperties;
  iconName?: string;
  space?: number;
  isActive?: boolean;
  disabled?: boolean;
  clickPreventDefault?: boolean;
  tooltip?: string;
}

const ToolbarItem: FC<ToolbarItemProps> = ({
  onClick,
  className,
  iconClassName,
  size = 18,
  children,
  style,
  title,
  iconName,
  clickPreventDefault = false,
  isActive = false,
  tooltip,
  disabled,
}) => {
  const renderItem = () => {
    if (iconName) {
      return (
        <Icon
          cursor={disabled ? "inherit" : "pointer"}
          className={iconClassName}
          size={size}
          name={iconName}
        />
      );
    }
    if (title) {
      return <div className={styles.title}>{title}</div>;
    }
    return children;
  };
  const handleClick = (e: MouseEvent) => {
    if (clickPreventDefault) {
      e.preventDefault();
    }
    onClick?.(e);
  };
  return cloneElement(
    createElement("div"),
    {
      key: iconName,
      "data-active": isActive,
      "data-disabled": disabled,
      className: classNames(className, ClassName.circleButton(undefined, 4)),
      style: {
        ...style,
        cursor: disabled ? "not-allowed" : style?.cursor,
      },
      onPointerDown: clickPreventDefault
        ? (e) => e.preventDefault()
        : undefined,
      onPointerUp: clickPreventDefault ? (e) => e.preventDefault() : undefined,
      onClick: handleClick,
    },
    <Tooltip content={tooltip}>{renderItem()}</Tooltip>
  );
};
export default ToolbarItem;
