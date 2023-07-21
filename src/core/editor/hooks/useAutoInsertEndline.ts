import Id from "@/utils/id";
import { RefObject, useEffect } from "react";
import { Transforms } from "slate";
import { CustomEditor } from "~/typings";

const useAutoInsertEndline = (
  scrollElementRef: RefObject<HTMLElement>,
  editor: CustomEditor
) => {
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (scrollElement) {
      const clickHandler = (e: MouseEvent) => {
        const textbox =
          scrollElementRef.current?.querySelector('[role="textbox"]');
        const lastEleRect = textbox?.lastElementChild?.getBoundingClientRect();
        if (lastEleRect && e.clientY > lastEleRect.bottom) {
          Transforms.insertNodes(
            editor,
            {
              type: "paragraph",
              children: [{ text: "" }],
              id: Id.getId(),
            },
            {
              at: [editor.children.length],
            }
          );
          Transforms.select(editor, [editor.children.length - 1]);
        }
      };
      scrollElement.addEventListener("click", clickHandler);
      return () => {
        scrollElement.removeEventListener("click", clickHandler);
      };
    }
  }, []);
};

export default useAutoInsertEndline;
