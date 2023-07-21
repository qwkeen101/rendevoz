import { FC, memo } from "react";
import { Container } from "@/components";
import { atom } from "jotai/vanilla";
import TabTitle from "@/components/layout/TabTitle";
import { IPdfInstance } from "~/typings";
import { ObjectStore } from "@/stores";
import Pdf from "@/core/pdf";

export const PdfPageStateAtom = atom({
  thumbnailVisible: false,
});
const PdfPage: FC<{
  pdfId: number;
  onInstanceInitialized?: (i: IPdfInstance) => void;
  disableTitle?: boolean;
}> = memo(({ pdfId, onInstanceInitialized, disableTitle }) => {
  const document = ObjectStore("pdf").useValue(pdfId);
  return (
    <>
      {!disableTitle && (
        <TabTitle
          title={document?.metadata?.title || document?.name || "Unknown book"}
          icon="park-file-pdf"
        />
      )}
      <Container auto>
        <Pdf pdfId={pdfId} onInstanceInitialized={onInstanceInitialized} />
      </Container>
    </>
  );
});
export default PdfPage;
