import { CollectionStore, globalStore, MetaStore } from '@/api/stores'
import { IIndexedMetaObjects, MetaObject } from '~/typings'
import { orderBy } from 'lodash'
import { IMetaVisibleConditions, metaObjectsAtom } from '@/api/stores/meta/meta.store'
import { PrimitiveAtom, atom as createAtom } from 'jotai'
import { useMemo } from 'react'
import { selectAtom } from 'jotai/utils'
import { useGlobalAtomValue } from '@/hooks'
import { compareStrings } from '@/utils'

export default (atom: PrimitiveAtom<Map<number, MetaObject>>, indexedAtom: PrimitiveAtom<IIndexedMetaObjects>) => {
  const calculateConditions = (m: MetaObject[], conditions?: IMetaVisibleConditions) => {
    const metas = m.filter(i => isVisibleMetaObject(i, conditions)) as MetaObject[]
    if (conditions?.sort) {
      const sort = conditions.sort
      if (sort === 'nameAsc') {
        return metas.sort((a, b) => compareStrings(a.name, b.name))
      } else if (sort === 'nameDsc') {
        return metas.sort((b, a) => compareStrings(a.name, b.name))
      }
      return orderBy(metas, i => i[sort.startsWith('viewAt') ? 'viewAt' : 'createdAt'], sort.endsWith('Asc') ? 'asc' : 'desc')
    }
    return metas
  }

  const getCachedMetaObject = (id: number) => globalStore.get(atom).get(id)
  function isVisibleMetaObject(
    o?: Partial<MetaObject> | number,
    opts?: IMetaVisibleConditions & {
      hideLabel?: boolean
    }
  ): o is MetaObject {
    const m = typeof o === 'number' ? getCachedMetaObject(o) : o?.id ? getCachedMetaObject(o.id) : o
    if (!m) return false
    if (m.type === 'collection') {
      if (opts?.showCollection) {
        if (m.deleted && !opts.showDeleted) {
          return false
        }
        return true
      }
      // show collection in trash bin
      if (opts?.showDeleted) {
        if (m.deleted) return true
        return false
      }
      return false
    }
    if (m.deleted && opts?.showDeleted === true) return true
    if ((m.deleted || (m.id && CollectionStore.isInsideDeletedCollection(m.id))) && opts?.showDeleted !== true) {
      return false
    }
    if (m.id && CollectionStore.collectionContains.has(m.id) && opts?.showInsideCollection === false) {
      return false
    }
    if (m.temp && !m.type?.includes('Label') && opts?.showTemp !== true) {
      return false
    }
    if (opts?.showAll === true) {
      return true
    }
    if (m.type?.includes('Label') && opts?.showLabel !== true) {
      return false
    }
    if (m.hidden && opts?.showHidden !== true) {
      return false
    }
    if (opts?.filter) {
      return opts.filter(m)
    }
    return true
  }
  const getMetaObjectsMap = (): Map<number, MetaObject> => {
    return globalStore.get(atom)
  }
  const getAll = (conditions?: IMetaVisibleConditions) => {
    const all = Array.from(getMetaObjectsMap().values())
    return calculateConditions(all, conditions)
  }
  const useValue = (id?: number) => {
    const ato = useMemo(() => (id ? selectAtom(metaObjectsAtom, m => m.get(id)) : createAtom(undefined)), [id])
    return useGlobalAtomValue(ato)
  }

  const useMultiple = (ids?: Iterable<number>) => {
    const a = useMemo(() => {
      if (!ids) return createAtom([])
      const idArr = Array.from(ids)
      const selected = selectAtom(
        metaObjectsAtom,
        map => idArr.map(id => map.get(id)).filter(i => i) as MetaObject[],
        (prev, curr) => prev.length === curr.length && prev.every((i, idx) => curr[idx] === i)
      )
      return selected
    }, [ids])
    return useGlobalAtomValue(a)
  }

  const useIndexedObjects = () => {
    return useGlobalAtomValue(indexedAtom)
  }

  const getMetaObjectByObjectId = (objId: number, filterAll = true): MetaObject | undefined => {
    const id = MetaStore.getIndexedMetaObjects()?.objectIdToMetaObjectMap.get(objId)
    if (id) {
      return MetaStore.getCachedMetaObject(id)
    }
    if (filterAll) {
      return getAll({ showAll: true }).find(i => i.objectId === objId)
    }
  }

  const useAll = (
    conditions?: IMetaVisibleConditions & {
      sort?: 'viewAtAsc' | 'viewAtDsc' | 'createdAtAsc' | 'createdAtDsc'
    }
  ) => {
    const all = useGlobalAtomValue(atom)
    return useMemo(() => {
      const metas = Array.from(all.values())
      return calculateConditions(metas, conditions)
    }, [all])
  }
  const useUndeleted = () => {
    const undeleted = useIndexedObjects().undeletedMetaObjectsSet
    return useMemo(() => Array.from(undeleted.values()), [undeleted])
  }
  return {
    getAll,
    isVisibleMetaObject,
    getMetaObjectsMap,
    useValue,
    useAll,
    useUndeleted,
    useMultiple
  }
}
