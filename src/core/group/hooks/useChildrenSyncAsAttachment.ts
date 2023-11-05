import { IMetaAttachment, MetaGroupChild, MetaObject } from '~/typings'
import { useEffect, useRef } from 'react'
import { MetaStore } from '@/stores'
import Id from '@/utils/id'

export default (metaObject?: MetaObject, children?: MetaGroupChild[]) => {
  const normalizeChildrenToAttachments = (children: MetaGroupChild[]): IMetaAttachment[] => {
    const metaMap = MetaStore.getMetaObjectsMap()
    return children
      .map(i => {
        if (i.type === 'metaObject') {
          if (!metaMap.has(i.id)) return
          return {
            type: metaMap.get(i.id)!.type,
            id: i.id,
            createdAt: Date.now()
          }
        }
        if (i.type === 'text') {
          return {
            type: 'attachmentText',
            text: i.textContent,
            createdAt: Date.now(),
            id: Id.getId()
          }
        }
      })
      .filter(i => i) as IMetaAttachment[]
  }
  const lastUpdated = useRef(Date.now())
  useEffect(() => {
    lastUpdated.current = Date.now()
    if (!metaObject) return
    const atts = metaObject.attachments || []
    if (children?.length) {
      if (children.length !== atts.length) {
        const normalizedAttachment = normalizeChildrenToAttachments(children)
        MetaStore.updateMetaObject({ id: metaObject.id, attachments: normalizedAttachment }, true)
      }
    } else {
      if (atts.length > 0) {
        MetaStore.updateMetaObject({ id: metaObject.id, attachments: [] }, true)
      }
    }
  }, [children])
}
