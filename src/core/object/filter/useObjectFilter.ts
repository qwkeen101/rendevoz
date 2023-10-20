import {
  metaObjectsAtom,
  relatedMetaObjectsMapAtom,
  tagToMetaObjectIdsMapAtom,
  undeletedMetaObjectsAtom,
} from "@/stores/meta.store";
import { globalStore } from "@/stores";
import { isWithinInterval } from "date-fns";
import fuzzysort from "fuzzysort";
import { useAtomValue, useStore } from "jotai/react";
import { atom } from "jotai/vanilla";
import { useEffect, useMemo } from "react";
import { MetaObject } from "~/typings/data";
import { FilterType } from ".";

export const FilterNameSearchAtom = atom<string>("");
export const FilterSelectedTagsAtom = atom<Map<number, Set<number>>>(new Map());
export const FilterDateIntervalsAtom = atom<Partial<Interval>>({});
export const FilterViewDateIntervalAtom = atom<Partial<Interval>>({});
export const FilterTypesAtom = atom<Set<MetaObject["type"]>>(
  new Set<MetaObject["type"]>()
);
export const CurrentFocusFilterAtom = atom<
  | {
      id: number;
      type: FilterType;
    }
  | undefined
>(undefined);
// 并集和交集结合
export const FilterRelatedIdsAtom = atom<Map<number, Set<number>>>(new Map());

export const ShouldFilterIdsAtom = atom<Set<number> | undefined>(undefined);

export const RealFilterRelatedIdsAtom = atom<Map<number, Set<number>>>(
  new Map()
);

export const useObjectFilter = (
  onChange: (ids: Set<number>) => void,
  store?: any,
  shouldFilterIdSet?: Set<number>
) => {
  const nameFilter = useAtomValue(FilterNameSearchAtom, { store });
  const tagFilter = useAtomValue(FilterSelectedTagsAtom, { store });
  const createDateFilter = useAtomValue(FilterDateIntervalsAtom, { store });
  const viewDateFilter = useAtomValue(FilterViewDateIntervalAtom, { store });
  const typeFilter = useAtomValue(FilterTypesAtom, { store });
  const realFilterRelatedIds = useAtomValue(RealFilterRelatedIdsAtom, {
    store,
  });
  const scopedStore = useStore();
  const shouldFilterObjectsAtom = useMemo(() => {
    const realStore = (store || scopedStore) as typeof scopedStore;
    if (shouldFilterIdSet) {
      realStore.set(ShouldFilterIdsAtom, shouldFilterIdSet);
      return atom((get) => {
        const allObjects: MetaObject[] = [];
        const metaObjects = get(metaObjectsAtom);
        shouldFilterIdSet.forEach((id) => {
          const obj = metaObjects.get(id);
          obj && allObjects.push(obj);
        });
        return allObjects;
      });
    } else {
      return undeletedMetaObjectsAtom;
    }
  }, [shouldFilterIdSet]);
  const shouldFilterObjects = useAtomValue(shouldFilterObjectsAtom, {
    store: globalStore,
  });
  const tagToMetaObjectIdsMap = useAtomValue(tagToMetaObjectIdsMapAtom, {
    store: globalStore,
  });
  const filterMap = useMemo(() => {
    const map = new Map<string, Set<number>>();
    return map;
  }, []);
  useEffect(() => {
    if (nameFilter === "" || nameFilter === undefined) {
      filterMap.delete("name");
      triggerChange();
      return;
    }
    const result = fuzzysort.go(nameFilter, shouldFilterObjects, {
      keys: ["name", "description"],
    });
    const filteredIdSet = new Set(
      Array.from(result.values()).map((i) => i.obj.id)
    );
    filterMap.set("name", filteredIdSet);
    triggerChange();
  }, [nameFilter]);
  useEffect(() => {
    if (tagFilter.size === 0) {
      filterMap.delete("tag");
      triggerChange();
      return;
    }
    const idSetArr: Set<number>[] = [];
    tagFilter.forEach((tags) => {
      const idSet = new Set<number>();
      tags.forEach((tag) => {
        const objIdSet = tagToMetaObjectIdsMap?.get(tag);
        if (objIdSet) {
          objIdSet.forEach((i) => {
            idSet.add(i);
          });
        }
      });
      idSetArr.push(idSet);
    });

    filterMap.set(
      "tag",
      intersectionOfMultipleSets(...idSetArr) as Set<number>
    );
    triggerChange();
  }, [tagFilter]);
  useEffect(() => {
    if (Object.keys(createDateFilter).length === 0) {
      filterMap.delete("createdAt");
      triggerChange();
      return;
    }
    const interval = structuredClone(createDateFilter) as Interval;
    if (interval.end === undefined) {
      interval.end = new Date();
    }
    if (interval.start === undefined) {
      interval.start = new Date(0);
    }
    if (interval.end < interval.start) return;
    const filteredIds = shouldFilterObjects
      .filter((i) => isWithinInterval(i.createdAt, interval))
      .map((i) => i.id);
    filterMap.set("createdAt", new Set(filteredIds));
    triggerChange();
  }, [createDateFilter]);

  useEffect(() => {
    if (Object.keys(viewDateFilter).length === 0) {
      filterMap.delete("viewAt");
      triggerChange();
      return;
    }
    const interval = structuredClone(viewDateFilter) as Interval;
    if (interval.end === undefined) {
      interval.end = new Date();
    }
    if (interval.start === undefined) {
      interval.start = new Date(0);
    }
    if (interval.end < interval.start) return;
    const filteredIds = shouldFilterObjects
      .filter((i) => i.viewAt && isWithinInterval(i.viewAt, interval))
      .map((i) => i.id);
    filterMap.set("viewAt", new Set(filteredIds));
    triggerChange();
  }, [viewDateFilter]);

  useEffect(() => {
    if (typeFilter.size === 0) {
      filterMap.delete("type");
      triggerChange();
      return;
    }
    const idSet = new Set<number>();
    shouldFilterObjects.forEach((obj) => {
      if (typeFilter.has(obj.type)) {
        idSet.add(obj.id);
      }
    });
    filterMap.set("type", idSet);
    triggerChange();
  }, [typeFilter]);
  useEffect(() => {
    if (realFilterRelatedIds.size === 0) {
      filterMap.delete("related");
      triggerChange();
      return;
    }
    const relatedIdMap = globalStore.get(relatedMetaObjectsMapAtom);
    const a = Array.from(realFilterRelatedIds.values()).map((ids) => {
      const currentSetRelatedIds = new Set<number>();
      ids.forEach((id) => {
        relatedIdMap.get(id)?.forEach((i) => currentSetRelatedIds.add(i));
        currentSetRelatedIds.add(id);
      });
      return currentSetRelatedIds;
    });
    const intersection = intersectionOfMultipleSets(...a) as Set<number>;
    filterMap.set("related", intersection);
    triggerChange();
  }, [realFilterRelatedIds]);
  useEffect(() => {
    triggerChange();
  }, [shouldFilterObjects]);
  const triggerChange = () => {
    const sets = Array.from(filterMap.values());
    if (sets.length === 0) {
      onChange(new Set(shouldFilterObjects.map((i) => i.id)));
      return;
    }
    const result = intersectionOfMultipleSets(...sets) as Set<number>;
    onChange(result);
  };
};
export const intersectionOfMultipleSets = (...sets: Set<any>[]) => {
  const res = new Set();
  if (sets.length) {
    sets.sort((a, b) => a.size - b.size);
    const smallest = sets.shift();
    for (const val of smallest) {
      if (sets.every((s) => s.has(val))) {
        res.add(val);
      }
    }
  }
  return res;
};
