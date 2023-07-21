import { css } from "@emotion/css";
import classNames from "classnames";
import { FC } from "react";

interface ContainerProps {
  className?: string;
  column?: boolean;
  auto?: boolean;
  levelCenter?: boolean;
  verticalCenter?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const Container: FC<ContainerProps> = ({
  column,
  auto,
  children,
  levelCenter,
  verticalCenter,
  style,
  className,
}) => {
  return (
    <div
      className={classNames(
        css({
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexGrow: 1,
          flexBasis: "auto",
        }),
        className
      )}
      style={{
        ...style,
        flexDirection: column ? "column" : "row",
        flex: auto ? "1 1 auto" : "initial",
        justifyContent: levelCenter ? "center" : "initial",
        alignItems: verticalCenter ? "center" : "initial",
      }}
    >
      {children}
    </div>
  );
};
export default Container;
