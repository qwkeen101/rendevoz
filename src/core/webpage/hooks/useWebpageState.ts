import Id from "@/utils/id";
import { atom, useAtom } from "jotai";
import { IWebpage, MetaObject } from "~/typings";

export type IWebpageState = {
  showReaderMode: boolean;
  currentWebpage?: IWebpage & { tempNoteId?: number };
  loaded: boolean;
  initialUrl?: string;
  navigationUrl?: string;
  editorId: string;
  faviconUrl?: string;
  title?: string;
  webpageFrom?: MetaObject["fromObject"];
};

const WebpageStateAtom = atom<IWebpageState>({
  showReaderMode: false,
  loaded: false,
  editorId: Id.getStrId(),
});

const useWebpageState = () => useAtom(WebpageStateAtom);

export default useWebpageState;
