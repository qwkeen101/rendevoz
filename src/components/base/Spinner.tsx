import { FC } from "react";
import { Content, Icon } from "..";

interface SpinnerProps {
  size?: number;
  color?: string;
}
const Spinner: FC<SpinnerProps> = ({ size = 20, color = "#8590ae" }) => {
  return (
    <Content fullHeight fullWidth flex centered>
      <Icon size={size} fill={color} name="park-loading-four" spin />
    </Content>
  );
};

export default Spinner;
