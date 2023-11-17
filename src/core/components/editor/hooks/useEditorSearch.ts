import { atom, useAtom } from "jotai";
import { Path } from "slate";
import { CustomText } from "~/typings/editor/baseTypes";

export type SearchEntry = {
  text: CustomText;
  path: Path;
  totalLength: number;
  startLength: number;
};
export type SearchOccurrence = {
  startEntry: SearchEntry;
  endEntry: SearchEntry;
  startOffset: number;
  endOffset: number;
};
export const EditorSearchAtom = atom<{
  query?: string;
  results?: Record<number, string>;
  //blockid => block has search num
  occurrences?: Record<number, number>;
  //block search entry cache: block id =>
  entryCache?: Record<number, SearchOccurrence[]>;
  currentOccurrence?: {
    blockId: number;
    idx: number;
  };
  isSearching?: boolean;
}>({});

const useEditorSearch = () => useAtom(EditorSearchAtom);

export default useEditorSearch;
