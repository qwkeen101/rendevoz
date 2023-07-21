import { Editor, Node } from "slate";
import { goToBlock } from "./blockActions";
import { CustomEditor, CustomElement } from "~/typings";
import { css, keyframes } from "@emotion/css";
import { ReactEditor } from "../slate-react";

const animationKeyframes = keyframes({
  "0%": {
    backgroundColor: "rgba(247, 219, 106, 0.5)",
  },
  "100%": {
    backgroundColor: `transparent`,
  },
});
export const blinkBg = css({
  animation: `${animationKeyframes} 0.8s infinite`,
  backgroundImage: "none !important",
  animationDirection: "alternate",
  transition: "all 0.3s ease",
});

export const blinkHighlights = (
  containerEle: HTMLElement,
  highlightId: number
) => {
  const highlights = containerEle.querySelectorAll(
    `[data-highlight='${highlightId}']`
  );
  highlights.forEach((i) => {
    i.classList.add(blinkBg);
  });
  setTimeout(() => {
    highlights.forEach((i) => {
      i.classList.remove(blinkBg);
    });
  }, 5600);
};

export const goToTextHighlight = (
  highlightId: number,
  editor: CustomEditor
) => {
  const iter = Node.texts(editor);
  for (const value of iter) {
    if (
      value &&
      "highlight" in value[0] &&
      value[0].highlight === highlightId
    ) {
      const [v, path] = value;
      const outermostBlock = Editor.node(editor, [path[0]])[0] as CustomElement;
      if (path) {
        goToBlock(outermostBlock.id, editor).then(() => {
          blinkHighlights(ReactEditor.toDOMNode(editor, editor), highlightId);
        });
      }
      break;
    }
  }
};
