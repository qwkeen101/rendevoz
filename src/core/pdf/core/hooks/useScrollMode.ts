import { atom, useAtom } from "jotai";
import { ScrollMode } from "../types/layout";

const scrollModeAtom = atom<ScrollMode>("vertical");

export const useScrollMode = () => useAtom(scrollModeAtom);
