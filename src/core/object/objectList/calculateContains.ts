import { ISubChat, MetaObject } from '~/typings'
import { CollectionStore, MetaStore, ObjectStore } from '@/api/stores'

export type ContainResult = {
  meta: MetaObject
  contains: number
  children: number[]
}
export type ContainResults = {
  group: ContainResult[]
  whiteboard: ContainResult[]
  video: ContainResult[]
  audio: ContainResult[]
  pdf: ContainResult[]
  webpage: ContainResult[]
  note: ContainResult[]
  chat: ContainResult[]
  collection: ContainResult[]
}
const removeRepeatNum = (nums: number[]) => Array.from(new Set(nums).values())

export default async (m: MetaObject, realtime = false): Promise<MetaObject[] | undefined> => {
  const metaMap = MetaStore.getMetaObjectsMap()
  const isAvailable = (id: number) => {
    const m = metaMap.get(id)
    if (m && !m.deleted) {
      return true
    }
    return false
  }
  const calculateInnerChatContains = async (object: any) => {
    if (typeof object === 'object' && 'aiChat' in object) {
      const chat = object.aiChat as ISubChat
      const allChats = chat.ids
      const allChatContainMessagesMetas = (
        await Promise.all(
          allChats.map(async i => {
            const obj = await ObjectStore('chat').fetchOneById(i)
            if (obj && obj.messages?.length) {
              const messages = obj.messages
                .map(i => MetaStore.getMetaObjectByObjectId(i, realtime))
                .filter(i => i && isAvailable(i.id)) as MetaObject[]
              if (messages.length) {
                return removeRepeatNum(messages.map(i => i.id)).map(i => metaMap.get(i)!)
              }
            }
            return []
          })
        )
      ).flat(1)
      return allChatContainMessagesMetas
    }
  }
  const calculateCommonContains = async () => {
    switch (m.type) {
      case 'collection': {
        if (m.objectId) {
          const collection = CollectionStore.getCachedCollectionById(m.objectId)
          if (collection) {
            const items = collection.items
            if (items?.length) {
              return removeRepeatNum(items.filter(i => i.type === 'meta').map(i => i.id))
                .map(i => metaMap.get(i))
                .filter(i => i && isAvailable(i.id)) as MetaObject[]
            }
          }
        }
        break
      }
      case 'exam': {
        if (m.objectId) {
          const obj = await ObjectStore(m.type).fetchOneById(m.objectId)
          if (obj && obj.questions?.length) {
            const questions = obj.questions
              .map(i => MetaStore.getMetaObjectByObjectId(i, realtime))
              .filter(i => i && isAvailable(i.id)) as MetaObject[]
            if (questions.length) {
              return removeRepeatNum(questions.map(i => i.id)).map(i => metaMap.get(i)!)
            }
          }
        }
        break
      }
      case 'chat': {
        if (m.objectId) {
          const obj = await ObjectStore(m.type).fetchOneById(m.objectId)
          if (obj && obj.messages?.length) {
            const messages = obj.messages
              .map(i => MetaStore.getMetaObjectByObjectId(i, realtime))
              .filter(i => i && isAvailable(i.id)) as MetaObject[]
            if (messages.length) {
              return removeRepeatNum(messages.map(i => i.id)).map(i => metaMap.get(i)!)
            }
          }
        }
        break
      }
      case 'whiteboard': {
        if (m.objectId) {
          const whiteboard = await ObjectStore('whiteboard').fetchOneById(m.objectId)
          if (whiteboard) {
            const metas = (
              (whiteboard.nodes && whiteboard.nodes instanceof Map
                ? Array.from(whiteboard.nodes.values())
                : Array.isArray(whiteboard.nodes)
                  ? whiteboard.nodes
                  : []) || []
            )
              .filter(i => i.type === 'metaObject')
              .map(i => i.metaObjectId)
              .filter(id => isAvailable(id))
            if (metas.length) {
              return removeRepeatNum(metas).map(id => metaMap.get(id)!)
            }
          }
        }
        break
      }
      case 'note': {
        if (m.objectId) {
          const note = await ObjectStore('note').fetchOneById(m.objectId)
          if (note) {
            const inside = (note.insideMetas ? Object.keys(note.insideMetas).map(i => Number(i)) : []).filter(i => isAvailable(i))
            const labels = (note.labels?.map(i => MetaStore.getMetaObjectByObjectId(i, realtime)).filter(i => i && isAvailable(i.id)) ||
              []) as MetaObject[]
            const has = inside.length + labels.length
            if (has) {
              return removeRepeatNum([...inside, ...labels.map(i => i.id)]).map(i => metaMap.get(i)!)
            }
          }
        }
        break
      }
      case 'group': {
        if (m.objectId) {
          const group = await ObjectStore('group').fetchOneById(m.objectId)
          if (group) {
            const metas = group.values.map(i => i.id).filter(i => isAvailable(i))
            if (metas.length) {
              return removeRepeatNum(metas).map(i => metaMap.get(i)!)
            }
          }
        }
        break
      }
      case 'webpage':
      case 'audio':
      case 'video':
      case 'pdf':
        {
          if (m.objectId) {
            const obj = await ObjectStore(m.type).fetchOneById(m.objectId)
            if (obj && obj.labels?.length) {
              const labels = obj.labels
                .map(i => MetaStore.getMetaObjectByObjectId(i, realtime))
                .filter(i => i && isAvailable(i.id)) as MetaObject[]
              if (labels.length) {
                return removeRepeatNum(labels.map(i => i.id)).map(i => metaMap.get(i)!)
              }
            }
          }
        }
        break
    }
  }
  const commonContains = new Map((await calculateCommonContains())?.map(i => [i.id, i]))
  if (m.objectId) {
    const object = await ObjectStore(m.type).getOneById(m.objectId)
    if (object) {
      const innerChatContains = await calculateInnerChatContains(object)
      if (innerChatContains) {
        innerChatContains.forEach(c => {
          commonContains.set(c.id, c)
        })
      }
    }
  }
  return Array.from(commonContains.values())
}
