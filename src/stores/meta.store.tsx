import { Content, Notification } from '@/components'
import useDb from '@/hooks/stores/useDb'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { atom } from 'jotai/vanilla'
import { useEffect, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { INote, IPdfDocument, MetaComment, MetaLink, MetaObject } from '~/typings/data'
import BaseStore from './base.store'
import useNoteStore, { notesAtom } from './note.store'
import { globalStore } from './stores'
import { typeToTypeRecord } from '@/components/knowledgeDatabase/card/DatabaseCard'
import { IStore } from './store.type'
import { useSetting } from '@/components/globalSetting/Main'
import { documentsAtom } from './document.store'
import { labelsAtom } from './label.store'
import { useAtomValue } from 'jotai/react'

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

export const TagToMetaObjectIdsMapAtom = atom<Map<string, Set<number>>>(get => {
  const map = new Map<string, Set<number>>()
  get(undeletedMetaObjectsAtom).forEach(i => {
    i.tags?.forEach(tag => {
      if (map.has(tag)) {
        map.get(tag)?.add(i.id)
      } else {
        const set = new Set<number>()
        set.add(i.id)
        map.set(tag, set)
      }
    })
  })
  return map
})

export const useMetaTargetObject = (metaObjectId: number) => {
  const metaObject = useAtomValue(metaObjectsAtom, { store: globalStore }).get(metaObjectId)
  const { updateMetaObject } = useMetaStore()
  if (!metaObject) return
  switch (metaObject.type) {
    case 'normal':
    case 'image':
      return {
        metaObject
      }
  }
  const { objectId } = metaObject
  if (!objectId)
    return {
      metaObject
    }
  const targetObjectAtom = useMemo(() => {
    switch (metaObject.type) {
      case 'note':
        return atom(get => get(notesAtom).get(objectId))
      case 'pdf':
        return atom(get => get(documentsAtom).get(objectId))
      case 'pdfElement':
        return atom(get => get(labelsAtom).get(objectId))
      default:
        return atom(null)
    }
  }, [objectId])
  const object = useAtomValue(targetObjectAtom, { store: globalStore })
  useEffect(() => {
    if (object) {
      switch (metaObject.type) {
        case 'note': {
          const { title } = object as INote
          if (metaObject.name !== title) {
            updateMetaObject({ id: metaObjectId, name: title })
          }
          break
        }
        case 'pdf': {
          const { name } = object as IPdfDocument
          if (metaObject.name !== name) {
            updateMetaObject({ id: metaObjectId, name })
          }
          break
        }
      }
    }
  }, [object])
  return {
    metaObject,
    targetObject: object
  }
}
const useMetaStore = () => {
  const { get, bulkAdd, initBaseObject, dispatch } = BaseStore
  const metaObjectDb = useDb('metaObjects')
  const metaLinkDb = useDb('metaLinks')
  const [setting] = useSetting()
  const shouldToastObject = setting.notification.enabled && setting.notification.object
  const shouldToastLink = setting.notification.enabled && setting.notification.link
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
            shouldToastObject &&
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
            shouldToastObject &&
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
          onSuccess: () => {
            shouldToastObject && toast.success('Object successfully deleted!')
            res(true)
          },
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
        if (initedMetaLink.sourceId === initedMetaLink.targetId) return
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
              shouldToastLink &&
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
            shouldToastLink && toast.success('Link successfully updated!')
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
            shouldToastLink && toast.success('Link successfully deleted!')
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

  return {
    getMetaObjectById,
    getMetaObjectByObjectId,
    ...realStore
  }
}

export default useMetaStore
