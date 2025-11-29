import { MetaStore, ObjectStore } from '@/api/stores'
import getChatTitle from '@/core/ai/chat/getChatTitle'

export default async (id: number, prevMessageId?: number) => {
  const meta = MetaStore.getMetaObjectByObjectId(id)
  if (meta) {
    if (meta.deleted) {
      MetaStore.updateMetaObject({ id: meta.id, deleted: false })
    }
    return meta.id
  }
  const message = await ObjectStore('message').fetchOneById(id)
  if (message) {
    if (prevMessageId) {
      ObjectStore('message').updateOne({ id, prevMessageId })
    }
    const chat = message.parentObjectId ? await ObjectStore('chat').getOneById(message.parentObjectId) : undefined
    const from = chat?.parentMetaId
      ? MetaStore.getCachedMetaObject(chat.parentMetaId)
      : chat
        ? MetaStore.getMetaObjectByObjectId(chat.id)
        : undefined
    const meta = await MetaStore.addMetaObject({
      objectId: message.id,
      type: 'message',
      fromObject: from
        ? {
            type: from.type,
            metaId: from.id
          }
        : undefined
    })
    const prevMessage = prevMessageId ? await ObjectStore('message').fetchOneById(prevMessageId) : undefined
    const messages: {
      role: string
      content: string
    }[] = []
    if (prevMessage && prevMessage.role === 'user' && prevMessage.content && typeof prevMessage.content === 'string') {
      messages.push({
        role: prevMessage.role,
        content: prevMessage.content
      })
    }
    if (message.content && typeof message.content === 'string') {
      messages.push({
        role: message.role,
        content: message.content
      })
    }
    getChatTitle(messages).then(res => {
      MetaStore.updateMetaObject({ id: meta.id, name: res })
    })
    return meta.id
  }
}
