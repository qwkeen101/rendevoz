import useDb from '@/hooks/stores/useDb'
import { GlobalScope } from '@/jotai/jotaiScope'
import { PartialWithId } from '@/types'
import Id from '@/utils/id'
import fuzzysort from 'fuzzysort'
import produce from 'immer'
import { atom, useAtom, useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { MetaComment, MetaLink, MetaObject } from '~/typings/data'
import BaseStore from './base.store'
import useNoteStore from './note.store'

const metaObjectsAtom = atom<Map<number, MetaObject>>(new Map())
const metaLinksAtom = atom<Map<number, MetaLink>>(new Map())
const { orderedData } = BaseStore
const allMetaObjectsAtom = atom(get => orderedData(get(metaObjectsAtom)))
export const undeletedMetaObjectsAtom = atom(get => get(allMetaObjectsAtom).filter(i => !i.deleted))

const allMetaLinksAtom = atom(get => orderedData(get(metaLinksAtom)))

export const undeletedMetaLinksAtom = atom(get => get(allMetaLinksAtom).filter(i => !i.deleted))

export const relatedMetaObjectsMapAtom = atom<Map<number, Set<number>>>(get => {
  const allMetaObjects = get(allMetaObjectsAtom)
  const allMetaLinks = get(allMetaLinksAtom)
  const map = new Map<number, Set<number>>()
  allMetaObjects.forEach(i => map.set(i.id, new Set()))
  allMetaLinks.forEach(l => {
    const source = l.sourceId
    const target = l.targetId
    map.get(source)?.add(target)
    map.get(target)?.add(source)
  })
  return map
})
const useMetaStore = () => {
  const [metaObjects, setMetaObjects] = useAtom(metaObjectsAtom, GlobalScope)
  const [metaLinks, setMetaLinks] = useAtom(metaLinksAtom, GlobalScope)
  const allMetaObjects = useAtomValue(allMetaObjectsAtom, GlobalScope)
  const allMetaLinks = useAtomValue(allMetaLinksAtom, GlobalScope)
  const { add, get, update, remove, buldRemove, bulkAdd, initBaseObject } = BaseStore
  const metaObjectDb = useDb('metaObjects')
  const metaCommentDb = useDb('metaComments')
  const metaLinkDb = useDb('metaLinks')

  const { addNote } = useNoteStore()

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
  const getMetaObjectByDocumentId = (documentId: number) => {
    return allMetaObjects.find(i => i.documentId === documentId)
  }
  const getMetaObjectByNoteId = (noteId: number) => {
    return allMetaObjects.find(i => i.noteId === noteId)
  }
  const addMetaObject = (metaObject: Partial<MetaObject>) => {
    const initedMetaObject = initBaseObject(metaObject) as MetaObject
    if (!initedMetaObject.name) {
      initedMetaObject.name = initedMetaObject.keyword || initedMetaObject.title || 'Unknown name'
    }

    if (!allMetaObjects.some(i => i.keyword && i.keyword === initedMetaObject.keyword)) {
      if (initedMetaObject.type !== 'note') {
        const noteId = Id.getId()
        initedMetaObject.noteId = noteId
        addNote({
          id: noteId,
          metaId: initedMetaObject.id
        })
      }
            metaObjectDb.put(initedMetaObject)
    }
    setMetaObjects(add(initedMetaObject, metaObjects))
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
  const updateMetaLink = (metaLink: Partial<MetaLink>) => {
    if (!metaLink.id) return
    const originMetaLink = metaLinks.get(metaLink.id)
    if (!originMetaLink) return
    const newMetaLink = Object.assign({}, originMetaLink, metaLink)
    setMetaLinks(update(newMetaLink, metaLinks))
    console.log(newMetaLink)
    metaLinkDb.put(newMetaLink)
  }
  const updateMetaComment = (metaComment: PartialWithId<MetaComment>) => {
    return metaCommentDb.get(metaComment.id).then(obj => {
      const newObj = Object.assign({}, obj, metaComment)
      metaCommentDb.put(newObj)
    })
  }
  const deleteMetaObject = (metaobjectId: number) => {
    setMetaObjects(remove(metaobjectId, metaObjects))
    metaObjectDb.delete(metaobjectId)
    const relatedLinkIds = allMetaLinks.filter(l => l.sourceId === metaobjectId || l.targetId === metaobjectId).map(l => l.id)
    setMetaLinks(buldRemove(relatedLinkIds, metaLinks))
    metaLinkDb.bulkDelete(relatedLinkIds)
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
      allMetaLinks,
      updateMetaLink,
      deleteMetaObject,
      getMetaObjectByDocumentId
    }),
    [metaObjects, metaLinks]
  )
}

export default useMetaStore
