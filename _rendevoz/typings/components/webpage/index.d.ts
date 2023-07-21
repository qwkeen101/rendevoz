import { IEditorInstance } from "../editor";

export type IWebpageInstance = Partial<{
  transformToNote: () => Promise<IEditorInstance>;
  editor: IEditorInstance;
  changeUrl: (url: string) => void;
  webview: WebpageInnerRef;
  clipHTML: () => Promise<{
    html: string;
    url: string;
  }>;
  navigateTo: (url: string) => void;
  navigateBack: () => string | undefined;
  navigateForward: () => string | undefined;
  refresh: VoidFunction;
  stop: VoidFunction;
  capturePage: () => Promise<NativeImage>;
  getId: () => number;
  zoomIn: VoidFunction;
  setUserAgent: (agent: string) => void;
  zoomOut: VoidFunction;
  findInPage?: (text: string) => void;
  getUrl?: () => string;
  handleClipHTML?: (html: string) => void;
}>;
