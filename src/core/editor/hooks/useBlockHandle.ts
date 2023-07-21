import { atom, useAtom } from "jotai";

type DragHandleProps = {
  left?: number;
  top?: number;
  targetHeight?: number;
  targetId?: number;
  visible?: boolean;
};
export const EditorBlockHandleAtom = atom<DragHandleProps>({
  visible: false,
});

const useEditorBlockHandle = () => useAtom(EditorBlockHandleAtom);

export default useEditorBlockHandle;
