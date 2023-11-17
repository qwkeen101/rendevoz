import { Editor, Element, Node } from "slate";
import { CustomEditor } from "~/typings";

const NoTextTypes: Element["type"][] = [
  "column",
  "columnList",
  "table",
  "tableRow",
];
export const serializeEditor = (
  node: Element,
  editor: CustomEditor,
  result: []
) => {
  if (
    node.children?.length &&
    !Editor.isEditor(node) &&
    !Editor.isInline(editor, node)
  ) {
    if (!NoTextTypes.includes(node.type)) {
      result.push(node);
    }
  }
  node.children?.forEach((i) => {
    const cloned = structuredClone(i);
    if (NoTextTypes.includes(cloned.type)) {
    }
    cloned.plain = Node.string(cloned);
    serializeEditor(cloned, editor, result);
  });
  return result;
};
