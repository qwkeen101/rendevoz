import { PDFDocumentProxy } from "pdfjs-dist";
import { TextContent } from "pdfjs-dist/types/src/display/api";
import { MutableRefObject } from "react";
import {
  ICanvasLayerInstance,
  IPdfInstance,
  IPdfViewer,
  ITextLayerInstance,
  PageFunctionRef,
} from "~/typings";
import { TextItemChar } from "./types/text";
import { normalizeChars } from "./utils/search";
import { renderPageInNormalMode } from "./utils/renderer";

export const PAGE_INDEX_TO_TEXT_LAYER = new WeakMap<
  IPdfViewer,
  Map<number, ITextLayerInstance>
>();

export const PDF_TO_DOC = new WeakMap<IPdfViewer, PDFDocumentProxy>();

export const PAGE_INDEX_TO_CANVAS_LAYER = new WeakMap<
  IPdfViewer,
  Map<number, ICanvasLayerInstance>
>();

// page index to blob url
export const PDF_TO_THUMBNAIL = new WeakMap<IPdfViewer, Map<number, string>>();

export const PAGE_INDEX_TO_PAGE_FUNCTION = new WeakMap<
  IPdfViewer,
  Map<number, MutableRefObject<PageFunctionRef>>
>();

export const PAGE_INDEX_TO_TEXT_CONTENT = new WeakMap<
  IPdfViewer,
  Map<
    number,
    {
      textContent: TextContent;
      chars: TextItemChar[];
      hasUnicodeChars: TextItemChar[];
      allTexts: string;
      normalizedIndexes: RegExpMatchArray[];
      normalizedText: string;
    }
  >
>();

export const getTextContent = async (viewer: IPdfViewer, pageIndex: number) => {
  const map = PAGE_INDEX_TO_TEXT_CONTENT.get(viewer) || new Map();
  PAGE_INDEX_TO_TEXT_CONTENT.set(viewer, map);
  if (PAGE_INDEX_TO_TEXT_CONTENT.get(viewer)?.has(pageIndex)) {
    console.log("retrieve text content from cache, page:" + pageIndex);
    return PAGE_INDEX_TO_TEXT_CONTENT.get(viewer)!.get(pageIndex);
  }
  const doc = await viewer.getDocument?.();
  if (doc) {
    const page = await doc.getPage(pageIndex + 1);
    const textContent = await page.getTextContent();
    const chars = textContent.items
      .map((i) => ("chars" in i ? i.chars : undefined))
      .filter((i) => i)
      .flat(1) as TextItemChar[];
    const result = normalizeChars(chars);
    const data = {
      textContent,
      ...result,
    };
    map.set(pageIndex, data);
    return data;
  }
};
export const deleteTextContent = async (
  viewer: IPdfViewer,
  pageIndex: number
) => {
  const map = PAGE_INDEX_TO_TEXT_CONTENT.get(viewer);
  map?.delete(pageIndex);
};
export const PDF_TO_RENDER_QUEUE = new WeakMap<IPdfViewer, Set<number>>();

export const PDF_IS_SELECTING = new WeakMap<IPdfInstance, boolean>();

export const removeFromRenderQueue = (
  viewer: IPdfViewer,
  pageIndex: number
) => {
  const queue = PDF_TO_RENDER_QUEUE.get(viewer);
  queue?.delete(pageIndex);
  if (queue?.size === 0) {
    renderPageInNormalMode();
    console.log("render in normal mode");
  }
};
