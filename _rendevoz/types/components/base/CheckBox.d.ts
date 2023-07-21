import { CSSProperties } from "react";

declare const CheckBox: ({
  checked,
  onChange,
  style,
  className,
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  style?: CSSProperties;
  className?: string;
}) => JSX.Element;
export default CheckBox;
