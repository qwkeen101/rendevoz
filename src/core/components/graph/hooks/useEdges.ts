import { atom, useAtom, useSetAtom } from "jotai";
import { GraphEdge } from "../types/edge";

export const edgesAtom = atom<GraphEdge[] | null>(null);

export const oppositeEdgesMapAtom = atom<Map<number, number>>(new Map());

export const useSetOppsiteEdgesMap = () => useSetAtom(oppositeEdgesMapAtom);

const useEdges = () => useAtom(edgesAtom);

export default useEdges;
