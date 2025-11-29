import { MetaObject } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import { slateToMarkdown } from '@/core/components/editor/plugins/slateToMarkdown'

export default async (id: number): Promise<MetaObject> => {
  const existed = MetaStore.getMetaObjectByObjectId(id)
  if (existed) return existed
  const q = await ObjectStore('examQuestion').getOneById(id)
  if (q) {
    const parentExamMeta = MetaStore.getMetaObjectByObjectId(q.parentObjectId)
    const m = await MetaStore.addMetaObject({
      objectId: q.id,
      name: q.name,
      description: slateToMarkdown(q.description || []),
      type: 'examQuestion',
      fromObject: parentExamMeta
        ? {
            type: parentExamMeta.type,
            metaId: parentExamMeta.id
          }
        : undefined
    })
    return m
  }
  return Promise.reject()
}
