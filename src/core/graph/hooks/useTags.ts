import { atom, useAtom } from "jotai";

const tagsAtom = atom<string[]>([]);

const useTags = () => useAtom(tagsAtom);

export default useTags;
