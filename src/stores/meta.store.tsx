import { Content, Notification } from '@/components'
import useDb from '@/hooks/stores/useDb'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { atom } from 'jotai/vanilla'
import { useEffect, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { INote, IPdfDocument, MetaLink, MetaObject } from '~/typings/data'
import BaseStore, { initializeLocalStore } from './base.store'
import useNoteStore, { notesAtom } from './note.store'
import { globalStore } from './stores'
import { typeToTypeRecord } from '@/components/knowledgeDatabase/card/DatabaseCard'
import { IStore } from './store.type'
import { documentsAtom } from './document.store'
import { labelsAtom } from './label.store'
import { useAtomValue } from 'jotai/react'
import getSetting from '@/components/globalSetting/getSetting'

export const metaObjectsAtom = atom<Map<number, MetaObject>>(new Map())

export const metaLinksAtom = atom<Map<number, MetaLink>>(new Map())

const { orderedData } = BaseStore

export const allMetaObjectsAtom = atom(get => orderedData(get(metaObjectsAtom)))

export const undeletedMetaObjectsAtom = atom(get => get(allMetaObjectsAtom).filter(i => !i.deleted && !i.temp))

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

  const { objectId } = metaObject || {}
  const targetObjectAtom = useMemo(() => {
    if (!objectId) return atom(null)
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
  if (!metaObject) return
  switch (metaObject.type) {
    case 'normal':
    case 'image':
      return {
        metaObject
      }
  }

  if (!objectId)
    return {
      metaObject
    }
  return {
    metaObject,
    targetObject: object
  }
}
const useMetaStore = () => {
  const { get, initBaseObject, dispatch } = BaseStore
  const metaObjectDb = useDb('metaObjects')
  const metaLinkDb = useDb('metaLinks')

  const { addNote } = useNoteStore()
  const initializeObjectStore = initializeLocalStore(metaObjectsAtom, metaObjectDb)
  const shouldToastObject = (silent?: boolean) => {
    const setting = getSetting()
    return !silent && setting.notification.enabled && setting.notification.object
  }
  const localObjectStore: Pick<IStore<MetaObject>, 'addOne' | 'updateOne' | 'deleteOneById' | 'getAll'> = {
    updateOne: (one, silent) => {
      return initializeObjectStore.updateOne(() => {
        shouldToastObject(silent) &&
          toast.success(
            <Notification
              title="Object successfully updated!"
              content={<div className={ClassName.description()}>Object Name: {obj.name}</div>}
            />
          )
      })(one, silent)
    },
    addOne: (one, silent) => {
      const initedMetaObject = initBaseObject(one)
      if (!initedMetaObject.name) {
        initedMetaObject.name = 'Unknown name'
      }
      initedMetaObject.type = initedMetaObject.type || 'normal'
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
      return initializeObjectStore.addOne(() => {
        shouldToastObject(silent) &&
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
      })(initedMetaObject, silent)
    },
    deleteOneById: (id, silent) => {
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
      return initializeObjectStore.deleteOneById(() => {
        shouldToastObject(silent) && toast.success('Object successfully deleted!')
      })(id, silent)
    },
    getAll: initializeObjectStore.getAll()
  }

  const initializedLinkStore = initializeLocalStore(metaLinksAtom, metaLinkDb)

  const shouldToastLink = (silent?: boolean) => {
    const setting = getSetting()
    return !silent && setting.notification.enabled && setting.notification.link
  }
  const localLinkStore: Pick<IStore<MetaLink>, 'addOne' | 'updateOne' | 'deleteOneById' | 'getAll'> = {
    addOne: (one, silent) => {
      if (one.sourceId === one.targetId) return Promise.reject()
      const allMetaLinks = globalStore.get(allMetaLinksAtom)
      const existed = allMetaLinks.find(i => i.sourceId === one.sourceId && i.targetId === one.targetId)
      if (existed) {
        console.log('ggg')
        shouldToastLink(silent) && toast.success('Link to be added already exists!')
        return Promise.resolve(existed)
      }
      return initializedLinkStore.addOne(() => {
        shouldToastLink(silent) && toast.success('Link successfully added!')
      })(one, silent)
    },
    getAll: initializedLinkStore.getAll(),
    deleteOneById: (one, silent) => {
      return initializedLinkStore.deleteOneById(() => {
        shouldToastLink(silent) && toast.success('Link successfully deleted!')
      })(one, silent)
    },
    updateOne: (one, silent) => {
      return initializedLinkStore.updateOne(() => {
        shouldToastLink(silent) && toast.success('Link successfully updated!')
      })(one, silent)
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
