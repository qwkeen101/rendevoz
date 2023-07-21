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
declare const Container: FC<ContainerProps>;
export default Container;
