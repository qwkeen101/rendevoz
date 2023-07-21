import { css } from "@emotion/css";
import classNames from "classnames";
import React, {
  CSSProperties,
  FC,
  MouseEventHandler,
  ReactNode,
  useEffect,
  useState,
} from "react";
import IconButton from "./IconButton";
import styles from "./index.module.less";
import ClassName from "@/styles/classNames";
import Colors from "@/consts/colors";

interface ButtonProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  onClick?: MouseEventHandler;
  className?: string;
  tabIndex?: number;
  style?: CSSProperties;
  selected?: boolean;
  disabled?: boolean;
}
interface IButton extends FC<ButtonProps> {
  IconButton: typeof IconButton;
}
export const Button: IButton = ({
  children,
  onClick,
  className,
  tabIndex,
  style,
  disabled,
}) => {
  const [coords, setCoords] = useState({ x: -1, y: -1 });
  const [isRippling, setIsRippling] = useState(false);

  useEffect(() => {
    if (coords.x !== -1 && coords.y !== -1 && !isRippling) {
      setIsRippling(true);
      setTimeout(() => setIsRippling(false), 600);
    } else setIsRippling(false);
  }, [coords]);

  useEffect(() => {
    if (!isRippling) setCoords({ x: -1, y: -1 });
  }, [isRippling]);

  return (
    <button
      type="button"
      tabIndex={tabIndex}
      className={classNames(
        css([
          {
            position: "relative",
            outline: "none",
            overflow: "hidden",
            background: "transparent",
            border: `1px solid ${Colors.Background.Border}`,
            cursor: "pointer",
          },
          ClassName.flatButton(4, "4px 12px"),
        ]),
        className
      )}
      style={{
        ...style,
        cursor: disabled ? "not-allowed" : style?.cursor,
        background: disabled ? "#bbbfc4" : style?.background,
      }}
      onClick={(e) => {
        if (disabled) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        onClick?.(e);
      }}
    >
      {isRippling ? (
        <span
          className={styles.ripple}
          style={{
            left: coords.x,
            top: coords.y,
          }}
        />
      ) : (
        ""
      )}
      <span className={styles.content}>{children}</span>
    </button>
  );
};

Button.IconButton = IconButton;
