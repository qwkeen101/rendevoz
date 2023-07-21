import { atom, useAtom } from "jotai";
import { IPdfDocument } from "~/typings";

type IPdfState = {
  pdfId?: number;
  document?: IPdfDocument;
  autoFitWhenResize?: boolean;
};

export const PdfStateAtom = atom<IPdfState>({
  autoFitWhenResize: true,
});

const usePdfState = () => useAtom(PdfStateAtom);

export default usePdfState;
