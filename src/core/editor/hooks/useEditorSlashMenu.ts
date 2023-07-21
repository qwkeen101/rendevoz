import { KEY } from "@/consts";
import isHotkey from "is-hotkey";
import React from "react";
import { CustomEditor } from "~/typings";
import getCursorPosition from "../utils/getCursorPosition";

const useEditorSlashMenu = (editor: CustomEditor) => {
  const handleSlashKeyDown: React.KeyboardEventHandler = (e) => {
    if (isHotkey(KEY.Slash, e)) {
      const cursorPosition = getCursorPosition(editor);
      if (cursorPosition) {
        editor.overlayManager?.setPosition({
          left: cursorPosition.x + 20,
          top: cursorPosition.y + 20,
        });
        console.log(cursorPosition);
        editor.overlayManager?.setContent("slashMenu");
        editor.overlayManager?.open();
      }
    } else {
      //   if (editor.overlayManager?.getContent() === 'slashMenu') {
      //     editor.overlayManager?.close()
      //   }
    }
    return;
  };

  return {
    handleSlashKeyDown,
  };
};

export default useEditorSlashMenu;
