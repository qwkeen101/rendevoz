import { MetaStore, ObjectStore } from '@/api/stores'

export default async (id: number) => {
  const chat = await ObjectStore('chat').getOneById(id)
  if (chat) {
    const meta = await MetaStore.addMetaObject({ objectId: chat.id, name: chat.name, type: 'chat' })
    const messages = await ObjectStore('message').getMultipleByIds(chat.messages, false)
    messages.forEach(m => {
      const messageMeta = MetaStore.getMetaObjectByObjectId(m.id, false)
      if (messageMeta) {
        MetaStore.updateMetaObject({
          id: messageMeta.id,
          fromObject: {
            type: 'chat',
            metaId: meta.id
          }
        })
      }
    })
    return meta
  }
}
