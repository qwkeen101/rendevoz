import { Modal } from "@/components";
import { usePdfViewer } from "@/core";
import ImageDisplayer from "@/core/image/ImageDisplayer";
import { useRef, useState } from "react";
import { PAGE_INDEX_TO_CANVAS_LAYER } from "../core/weakMaps";
import {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from "@excalidraw/excalidraw/types/types";
import {
  exportToCanvas,
  loadFromBlob,
  MIME_TYPES,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import { saveBlobLocally } from "@/utils/file";
import { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import Id from "@/utils/id";
import { ICanvasLayerInstance } from "~/typings";
import { getCommonBounds } from "@excalidraw/excalidraw/dist/excalidraw.production.min.js";

const usePdfDraw = (options: { onClose?: VoidFunction } = {}) => {
  const viewer = usePdfViewer();
  const [annotationState, setAnnotationState] = useState<{
    visible?: boolean;
    pdfPageUrl?: string;
    initialData?: ExcalidrawInitialDataState;
  }>({
    visible: false,
  });
  const excalidrawRef = useRef<ExcalidrawImperativeAPI>(null);
  const { visible, pdfPageUrl, initialData } = annotationState;
  const { onClose } = options;
  const renderModal = () => {
    return (
      <Modal
        visible={!!visible}
        onClose={async () => {
          setAnnotationState((s) => ({ visible: false }));
          onClose?.();
        }}
        noStyle
      >
        <div style={{ width: "90vw", height: "90vh" }}>
          {(pdfPageUrl || initialData) && (
            <ImageDisplayer
              initialData={initialData}
              imageUrl={pdfPageUrl}
              ref={excalidrawRef}
            />
          )}
        </div>
      </Modal>
    );
  };
  const open = async (pageIndex: number, initialData?: Blob) => {
    if (viewer && (pageIndex || initialData)) {
      const canvasInstance =
        PAGE_INDEX_TO_CANVAS_LAYER.get(viewer)?.get(pageIndex);
      if (canvasInstance) {
        const tempCanvas = document.createElement("canvas");
        canvasInstance.renderPage(tempCanvas, async () => {
          const dataUrl = tempCanvas.toDataURL("image/png");
          if (dataUrl) {
            if (initialData) {
              const data = await loadFromBlob(initialData, null, null);
              setAnnotationState((s) => ({
                ...s,
                visible: true,
              }));
              data.files["initial_image"] = {
                id: "initial_image",
                dataURL: dataUrl,
                mimeType: "image/png",
              };
              setTimeout(() => {
                setAnnotationState((s) => ({ ...s, initialData: data }));
              }, 300);
              return;
            }
            setAnnotationState((s) => ({
              ...s,
              visible: true,
            }));
            setTimeout(() => {
              setAnnotationState((s) => ({ ...s, pdfPageUrl: dataUrl }));
            }, 300);
          }
        });
      }
    }
  };
  const save = async (targetUrl?: string) => {
    const api = excalidrawRef.current;
    if (api) {
      // delete the pdf page image file, because we don't need it
      const files = api.getFiles();
      delete files["initial_image"];
      const serializedJsonData = serializeAsJSON(
        api.getSceneElements(),
        api.getAppState(),
        files,
        "local"
      );
      const blob = new Blob([serializedJsonData], {
        type: MIME_TYPES.excalidraw,
      });
      const fileUrl = await saveBlobLocally(
        blob,
        `pdf_annotation_data_${Id.getStrId()}`,
        targetUrl
      );
      return fileUrl;
    }
  };

  const drawOnPdf = async (
    elements: NonDeletedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
    canvasInstance: ICanvasLayerInstance,
    rerender?: boolean
  ) => {
    // filter out initial image
    const pdfPageElementIdx = elements.findIndex(
      (i) => i.id === "initial_image"
    );
    if (pdfPageElementIdx < 0) return;
    const pdfPageElement = elements[pdfPageElementIdx];
    const commonBounds = getCommonBounds(elements);
    elements.splice(pdfPageElementIdx, 1, {
      ...pdfPageElement,
      opacity: 0,
    });
    const canvasEle = canvasInstance.getCanvasEle();
    if (!canvasEle) return;
    const state = { ...appState, exportBackground: false };

    const exportedCanvas = await exportToCanvas({
      elements,
      appState: state,
      files,
      exportPadding: 0,
    });

    const ctx = exportedCanvas.getContext("2d");
    if (ctx) {
      if (rerender) {
        canvasInstance.renderPage(canvasEle, () => {
          const relativeX = pdfPageElement.x - commonBounds[0];
          const relativeY = pdfPageElement.y - commonBounds[1];
          const pdfCtx = canvasEle.getContext("2d")!;

          pdfCtx.drawImage(
            exportedCanvas,
            relativeX,
            relativeY,
            pdfPageElement.width,
            pdfPageElement.height,
            0,
            0,
            canvasEle.width,
            canvasEle.height
          );
        });
      } else {
        const relativeX = pdfPageElement.x - commonBounds[0];
        const relativeY = pdfPageElement.y - commonBounds[1];
        const pdfCtx = canvasEle.getContext("2d")!;

        pdfCtx.drawImage(
          exportedCanvas,
          relativeX,
          relativeY,
          pdfPageElement.width,
          pdfPageElement.height,
          0,
          0,
          canvasEle.width,
          canvasEle.height
        );
      }
    }
  };
  return {
    renderModal,
    open,
    save,
    drawOnPdf,
  };
};

export default usePdfDraw;
