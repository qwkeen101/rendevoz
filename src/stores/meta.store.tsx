import { Content, Notification } from '@/components'
import useDb from '@/hooks/stores/useDb'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { atom } from 'jotai/vanilla'
import { useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { MetaComment, MetaLink, MetaObject } from '~/typings/data'
import BaseStore from './base.store'
import useNoteStore from './note.store'
import { globalStore } from './stores'
import { typeToTypeRecord } from '@/components/knowledgeDatabase/card/DatabaseCard'
import { IStore } from './store.type'

export const metaObjectsAtom = atom<Map<number, MetaObject>>(new Map())

const metaLinksAtom = atom<Map<number, MetaLink>>(new Map())

const { orderedData } = BaseStore

export const allMetaObjectsAtom = atom(get => orderedData(get(metaObjectsAtom)))

export const undeletedMetaObjectsAtom = atom(get => get(allMetaObjectsAtom).filter(i => !i.deleted))

export const pinnedMetaObjectsAtom = atom(get => get(undeletedMetaObjectsAtom).filter(i => i.pinned))

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

export const ObjectIdToMetaObjectMapAtom = atom<Map<number, MetaObject>>(get => {
  const metaMap = get(metaObjectsAtom)
  const otmMap = new Map()
  metaMap.forEach(i => {
    if (i.objectId) {
      otmMap.set(i.objectId, i)
    }
  })
  return otmMap
})

const useMetaStore = () => {
  const { get, bulkAdd, initBaseObject, dispatch } = BaseStore
  const metaObjectDb = useDb('metaObjects')
  const metaLinkDb = useDb('metaLinks')

  const { addNote } = useNoteStore()

  const localObjectStore: Pick<IStore<MetaObject>, 'addOne' | 'updateOne' | 'deleteOneById' | 'getAll'> = {
    updateOne: obj => {
      if (!obj.id) return Promise.resolve(undefined)
      return new Promise(res => {
        dispatch({
          type: 'update',
          data: obj,
          database: metaObjectDb,
          atom: metaObjectsAtom,
          onSuccess: obj => {
            toast.success(
              <Notification
                title="Object successfully updated!"
                content={<div className={ClassName.description()}>Object Name: {obj.name}</div>}
              />
            )
            res(obj)
          }
        })
      })
    },
    addOne: obj => {
      return new Promise(res => {
        const initedMetaObject = initBaseObject(obj) as MetaObject
        if (!initedMetaObject.name) {
          initedMetaObject.name = 'Unknown name'
        }

        if (initedMetaObject.type === 'normal') {
          const noteId = Id.getId()
          initedMetaObject.objectId = noteId
          addNote(
            {
              id: noteId,
              metaId: initedMetaObject.id
            },
            true
          )
        }
        dispatch({
          type: 'add',
          atom: metaObjectsAtom,
          data: initedMetaObject,
          database: metaObjectDb,
          onSuccess: obj => {
            toast.success(
              <Notification
                title="Object successfully added!"
                content={
                  <div className={ClassName.description()}>
                    <div>Name: {initedMetaObject.name}</div>
                    <div style={{ textTransform: 'capitalize' }}>Type: {typeToTypeRecord[initedMetaObject.type || 'normal']}</div>
                  </div>
                }
              />
            )
            res(obj)
          }
        })
      })
    },
    deleteOneById: id => {
      return new Promise(res => {
        dispatch({
          type: 'remove',
          data: {
            id
          },
          database: metaObjectDb,
          atom: metaObjectsAtom,
          onSuccess: () => res(true),
          onFail: () => res(false)
        })
        const allMetaLinks = globalStore.get(undeletedMetaLinksAtom)
        const relatedLink = allMetaLinks.filter(l => l.sourceId === id || l.targetId === id)
        relatedLink.forEach(i =>
          dispatch({
            type: 'remove',
            data: { id: i.id },
            database: metaLinkDb,
            atom: metaLinksAtom
          })
        )
      })
    },
    getAll: async () => {
      const array = await metaObjectDb.toArray()
      globalStore.set(metaObjectsAtom, bulkAdd(array, globalStore.get(metaObjectsAtom)))
      return true
    }
  }

  const localLinkStore: Pick<IStore<MetaLink>, 'addOne' | 'updateOne' | 'deleteOneById' | 'getAll'> = {
    addOne: link => {
      return new Promise(res => {
        const initedMetaLink = initBaseObject(link) as MetaLink
        const allMetaLinks = globalStore.get(allMetaLinksAtom)
        const existed = allMetaLinks.some(i => i.sourceId === initedMetaLink.sourceId && i.targetId === initedMetaLink.targetId)
        if (!existed) {
          dispatch({
            type: 'add',
            data: initedMetaLink,
            database: metaLinkDb,
            atom: metaLinksAtom,
            onSuccess: obj => {
              const atomMap = globalStore.get(metaObjectsAtom)
              const sourceObject = atomMap.get(obj.sourceId)
              const targetObject = atomMap.get(obj.targetId)
              res(obj)
              toast.success(
                <Notification
                  title="Link successfully added!"
                  content={
                    <div style={{ textTransform: 'capitalize' }} className={ClassName.description()}>
                      <Content flex alignItems="center" gap={16}>
                        Source type:
                        <span className={ClassName.tag('transparent', undefined, undefined, '12px')}>
                          {typeToTypeRecord[sourceObject?.type || 'normal']}
                        </span>
                      </Content>
                      <Content flex alignItems="center" gap={16}>
                        Target type:
                        <span className={ClassName.tag('transparent', undefined, undefined, '12px')}>
                          {typeToTypeRecord[targetObject?.type || 'normal']}
                        </span>
                      </Content>
                    </div>
                  }
                />
              )
            }
          })
        }
      })
    },
    updateOne: link => {
      return new Promise(res => {
        if (!link.id) return
        dispatch({
          type: 'update',
          data: link,
          database: metaLinkDb,
          atom: metaLinksAtom,
          onSuccess: obj => {
            toast.success('Link successfully updated!')
            res(obj)
          }
        })
      })
    },
    deleteOneById: id => {
      return new Promise(res => {
        dispatch({
          type: 'remove',
          data: {
            id
          },
          database: metaLinkDb,
          atom: metaLinksAtom,
          onSuccess: () => {
            toast.success('Link successfully deleted!')
            res(true)
          }
        })
      })
    },
    getAll: async () => {
      const array = await metaLinkDb.toArray()
      globalStore.set(metaLinksAtom, bulkAdd(array, globalStore.get(metaLinksAtom)))
      return true
    }
  }

  const realStore = {
    addMetaObject: localObjectStore.addOne,
    updateMetaObject: localObjectStore.updateOne,
    deleteMetaObject: localObjectStore.deleteOneById,
    getAllMetaObjects: localObjectStore.getAll,
    addMetaLink: localLinkStore.addOne,
    deleteMetaLink: localLinkStore.deleteOneById,
    getAllMetaLinks: localLinkStore.getAll,
    updateMetaLink: localLinkStore.updateOne
  }

  const getMetaObjectById = (id: number): Promise<MetaObject | undefined> => {
    const obj = get(id, globalStore.get(metaObjectsAtom))
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
  const getMetaObjectByObjectId = (objId: number) => {
    return globalStore.get(ObjectIdToMetaObjectMapAtom).get(objId)
  }
  // const addMetaComment = (objId: number, metaComment: Partial<MetaComment>) => {
  //   const initedMetaComment = initBaseObject(metaComment)
  //   metaCommentDb.put(initedMetaComment)
  //   getMetaObjectById(objId).then(originObj => {
  //     if (!originObj) return
  //     const newObj = produce(originObj, draft => {
  //       draft.commentIds = draft.commentIds ? [...draft.commentIds, initedMetaComment.id] : [initedMetaComment.id]
  //     })
  //     setMetaObjects(update(newObj, metaObjects))
  //     metaObjectDb.put(newObj)
  //   })
  // }
  // const updateMetaComment = (metaComment: PartialWithId<MetaComment>) => {
  //   return metaCommentDb.get(metaComment.id).then(obj => {
  //     const newObj = Object.assign({}, obj, metaComment)
  //     metaCommentDb.put(newObj)
  //   })
  // }
  // const deleteMetaComment = (objId: number, metaCommentId: number) => {
  //   getMetaObjectById(objId).then(originObj => {
  //     if (!originObj) return
  //     const newObj = produce(originObj, draft => {
  //       draft.commentIds = draft.commentIds?.filter(i => i !== metaCommentId)
  //     })
  //     metaObjectDb.put(newObj)
  //     setMetaObjects(update(newObj, metaObjects))
  //     metaCommentDb.delete(metaCommentId)
  //   })
  // }
  // const getMetaCommentsByIds = (ids: number[]) => {
  //   return metaCommentDb.bulkGet(ids)
  // }
  return useMemo(
    () => ({
      getMetaObjectById,
      getMetaObjectByObjectId,
      ...realStore
    }),
    []
  )
}

export default useMetaStore
