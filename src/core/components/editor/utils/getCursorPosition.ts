import { CustomEditor, XYPosition } from "~/typings";
import { ReactEditor } from "../slate-react";

const getCursorPosition = (editor: CustomEditor): XYPosition | undefined => {
  const { selection } = editor;
  if (selection) {
    const domRange = ReactEditor.toDOMRange(editor, selection);
    const rect = domRange.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
    };
  }
};

export default getCursorPosition;
