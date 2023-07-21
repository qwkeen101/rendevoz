import { atom, useAtom } from "jotai";

const isDraggingAtom = atom(false);
const isDraggingDividerAtom = atom(false);
export const useIsDraggingDivider = () => useAtom(isDraggingDividerAtom);
const useIsDragging = () => useAtom(isDraggingAtom);

export default useIsDragging;
