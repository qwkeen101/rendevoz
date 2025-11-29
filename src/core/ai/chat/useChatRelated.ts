import { IAIMessage, MetaLink } from '~/typings'
import { MetaStore } from '@/api/stores'
import { useEffect } from 'react'

export default (id: number, messages: IAIMessage[]) => {
  const chatMeta = MetaStore.useObjectToMetaValue(id)
  useEffect(() => {
    if (chatMeta) {
      const withSourceMessages = messages.filter(i => i.source)
      const links: Partial<MetaLink>[] = []
      withSourceMessages.forEach(m => {
        const source = m.source!
        const objectId = source.objectId
        if (objectId) {
          const m = MetaStore.getMetaObjectByObjectId(objectId)
          if (m) {
            links.push({
              sourceId: m.id,
              targetId: chatMeta.id
            })
          }
        }
      })
      const index = MetaStore.getIndexedMetaLinks()?.targetIdToSourceIdsMap
      if (index) {
        links.forEach(link => {
          if (!index.get(link.targetId!)?.has(link.sourceId!)) {
            MetaStore.addMetaLink(link)
          }
        })
      }
    }
  }, [messages.length, chatMeta?.id])
}
