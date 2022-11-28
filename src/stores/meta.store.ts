import useDb from '@/hooks/stores/useDb'
import { GlobalScope } from '@/jotai/jotaiScope'
import { PartialWithId } from '@/types'
import Id from '@/utils/id'
import fuzzysort from 'fuzzysort'
import produce from 'immer'
import { atom, useAtom } from 'jotai'
import { useMemo } from 'react'
import { MetaComment, MetaKnowledgeObject, MetaLink, MetaObject } from '~/typings/data'
import BaseStore from './base.store'

const metaObjectsAtom = atom<Map<number, MetaObject>>(new Map())
const metaLinksAtom = atom<Map<number, MetaLink>>(new Map())
const useMetaStore = () => {
  const [metaObjects, setMetaObjects] = useAtom(metaObjectsAtom, GlobalScope)
  const [metaLinks, setMetaLinks] = useAtom(metaLinksAtom, GlobalScope)
  const { add, get, orderedData, update, bulkAdd, initBaseObject } = BaseStore
  const metaObjectDb = useDb('metaObjects')
  const metaCommentDb = useDb('metaComments')
  const metaLinkDb = useDb('metaLinks')
  const all = orderedData(metaObjects)

  const getAllMetaObjects = () => {
    metaObjectDb.toArray().then(data => {
      setMetaObjects(bulkAdd(data, metaObjects))
    })
  }
  const getAllMetaLinks = () => {
    metaLinkDb.toArray().then(data => {
      setMetaLinks(bulkAdd(data, metaLinks))
    })
  }
  const getMetaObjectById = (id: number): Promise<MetaObject | undefined> => {
    const obj = get(id, metaObjects)
    if (obj) return Promise.resolve(obj)
    return new Promise(res => {
      metaObjectDb.get(id).then(obj => {
        if (obj) {
          res(obj)
        } else {
          res(undefined)
        }
      })
    })
  }
  const getMetaKnowObjectByKeyword = (keyword: string) => {
    return all.find(i => i.keyword === keyword)
  }

  const addMetaObject = (metaObject: Partial<MetaObject>) => {
    const initedMetaObject = initBaseObject(metaObject) as MetaObject
    setMetaObjects(add(initedMetaObject, metaObjects))
    if (!all.find(i => i.keyword === initedMetaObject.keyword)) {
      metaObjectDb.put(initedMetaObject)
    }
    return Promise.resolve(initedMetaObject)
  }
  const updateMetaObject = (metaObject: Partial<MetaObject>) => {
    if (!metaObject.id) return
    getMetaObjectById(metaObject.id).then(originObj => {
      if (!originObj) return
      const newObj = Object.assign({}, originObj, metaObject)
      setMetaObjects(update(newObj, metaObjects))
      metaObjectDb.put(newObj)
    })
  }
  const addMetaLink = (metaLink: Partial<MetaLink>) => {
    const initedMetaLink = initBaseObject(metaLink) as MetaLink
    metaLinkDb.put(initedMetaLink)
  }
  const addMetaComment = (objId: number, metaComment: Partial<MetaComment>) => {
    const initedMetaComment = initBaseObject(metaComment)
    metaCommentDb.put(initedMetaComment)
    getMetaObjectById(objId).then(originObj => {
      if (!originObj) return
      const newObj = produce(originObj, draft => {
        draft.commentIds = draft.commentIds ? [...draft.commentIds, initedMetaComment.id] : [initedMetaComment.id]
      })
      setMetaObjects(update(newObj, metaObjects))
      metaObjectDb.put(newObj)
    })
  }
  const updateMetaComment = (metaComment: PartialWithId<MetaComment>) => {
    return metaCommentDb.get(metaComment.id).then(obj => {
      const newObj = Object.assign({}, obj, metaComment)
      metaCommentDb.put(newObj)
    })
  }
  const deleteMetaComment = (objId: number, metaCommentId: number) => {
    getMetaObjectById(objId).then(originObj => {
      if (!originObj) return
      const newObj = produce(originObj, draft => {
        draft.commentIds = draft.commentIds?.filter(i => i !== metaCommentId)
      })
      metaObjectDb.put(newObj)
      setMetaObjects(update(newObj, metaObjects))
      metaCommentDb.delete(metaCommentId)
    })
  }
  const getMetaCommentsByIds = (ids: number[]) => {
    return metaCommentDb.bulkGet(ids)
  }
  const searchMetaObject = (query: string) => {
    const results = fuzzysort.go(
      query,
      all.filter(i => !!i.keyword),
      { key: 'keyword' }
    )
    return results
  }
  return useMemo(
    () => ({
      getMetaObjectById,
      getMetaKnowObjectByKeyword,
      getAllMetaObjects,
      addMetaObject,
      addMetaComment,
      updateMetaComment,
      getMetaCommentsByIds,
      updateMetaObject,
      searchMetaObject,
      deleteMetaComment,
      addMetaLink,
      getAllMetaLinks
    }),
    [metaObjects]
  )
}

export default useMetaStore
