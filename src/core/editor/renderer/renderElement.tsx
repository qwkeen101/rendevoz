import { RenderElementProps } from "slate-react";
import { EditorTypeToElementMap } from "../maps";

export const Element = (props: RenderElementProps) => {
  const renderer = EditorTypeToElementMap.get(
    props.element.type
  )?.renderElement;
  if (!renderer) return null;
  return renderer(props);
};
