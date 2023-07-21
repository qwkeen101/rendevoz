import { FC, memo } from "react";
import { RenderElementProps } from "slate-react";

const Paragraph: FC<RenderElementProps> = memo(({ children }) => {
  return <p>{children}</p>;
});

export default Paragraph;
