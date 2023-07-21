import { Noop } from "@/common/types";
import { CSSProperties, FC } from "react";

interface FooterProps {
  submitText?: string;
  backText?: string;
  onSubmit?: Noop;
  onBack?: Noop;
  buttonStyle?: CSSProperties;
}
declare const Footer: FC<FooterProps>;
export default Footer;
