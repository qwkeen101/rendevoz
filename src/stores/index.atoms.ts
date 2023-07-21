import { atom } from "jotai";
import { ObjectStore } from ".";
import { IWebpage } from "~/typings";

export const webpageUrlToIdAtom = atom<Map<string, IWebpage>>((get) => {
  const webpageMap = get(ObjectStore("webpage").objectMapAtom);
  const map = new Map();
  webpageMap.forEach((i) => {
    map.set(i.url, i);
  });
  return map;
});
