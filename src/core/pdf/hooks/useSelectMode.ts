import { atom, useAtom } from "jotai";

const PdfSelectModeAtom = atom(false);

const usePdfSelectMode = () => useAtom(PdfSelectModeAtom);

export default usePdfSelectMode;
