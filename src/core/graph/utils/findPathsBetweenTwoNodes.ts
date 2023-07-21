import { globalStore } from "@/stores";
import { indexedMetaLinksAtom } from "@/stores/meta.store";

export const findPathsBetweenTwoMetaObjects = (
  sourceMetaId: number,
  targetMetaId: number
) => {
  const visitedIdSet = new Set<number>();
  const sourceToTargetMap =
    globalStore.get(indexedMetaLinksAtom)?.sourceIdToTargetIdsMap;
  const data: number[][] = [];
  const recursivelyTraverse = (currentId: number, path: number[] = []) => {
    if (currentId === targetMetaId) {
      path.push(currentId);
      return path;
    }
    if (visitedIdSet.has(currentId)) return;
    visitedIdSet.add(currentId);
    const currentToTargetMap = sourceToTargetMap?.get(currentId);

    if (!currentToTargetMap) return;
    path.push(currentId);
    Array.from(currentToTargetMap.values()).forEach((target) => {
      const res = recursivelyTraverse(target, [...path]);
      if (res) data.push(res);
    });
  };
  recursivelyTraverse(sourceMetaId);
  return data;
};
