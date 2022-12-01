import useDb from '@/hooks/stores/useDb'
import { GlobalScope } from '@/jotai/jotaiScope'
import { PartialWithId } from '@/types'
import fuzzysort from 'fuzzysort'
import produce from 'immer'
import { atom, useAtom, useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { MetaComment, MetaLink, MetaObject } from '~/typings/data'
import BaseStore from './base.store'

const metaObjectsAtom = atom<Map<number, MetaObject>>(new Map())
const metaLinksAtom = atom<Map<number, MetaLink>>(new Map())
const { orderedData } = BaseStore
const allMetaObjectsAtom = atom(get => orderedData(get(metaObjectsAtom)))
const allMetaLinksAtom = atom(get => orderedData(get(metaLinksAtom)))
const useMetaStore = () => {
  const [metaObjects, setMetaObjects] = useAtom(metaObjectsAtom, GlobalScope)
  const [metaLinks, setMetaLinks] = useAtom(metaLinksAtom, GlobalScope)
  const allMetaObjects = useAtomValue(allMetaObjectsAtom, GlobalScope)
  const allMetaLinks = useAtomValue(allMetaLinksAtom, GlobalScope)
  const { add, get, update, bulkAdd, initBaseObject } = BaseStore
  const metaObjectDb = useDb('metaObjects')
  const metaCommentDb = useDb('metaComments')
  const metaLinkDb = useDb('metaLinks')

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
    return allMetaObjects.find(i => i.keyword === keyword)
  }
  const getMetaObjectByNoteId = (noteId: number) => {
    return allMetaObjects.find(i => i.noteId === noteId)
  }
  const addMetaObject = (metaObject: Partial<MetaObject>) => {
    const initedMetaObject = initBaseObject(metaObject) as MetaObject
    setMetaObjects(add(initedMetaObject, metaObjects))
    console.log(metaObject)
    if (!allMetaObjects.some(i => i.keyword && i.keyword === initedMetaObject.keyword)) {
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
    const existed = allMetaLinks.some(i => i.sourceId === metaLink.sourceId && i.targetId === metaLink.targetId)
    if (!existed) {
      metaLinkDb.put(initedMetaLink)
    }
    setMetaLinks(add(initedMetaLink, metaLinks))
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
      allMetaObjects.filter(i => !!i.keyword),
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
      getAllMetaLinks,
      getMetaObjectByNoteId,
      allMetaObjects,
      allMetaLinks
    }),
    [metaObjects, metaLinks]
  )
}

export default useMetaStore
