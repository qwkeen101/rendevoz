import { GlobalInstance, useDb } from '@/hooks'
import { MetaObject } from '~/typings'

export default async () => {
  const objDb = useDb('objects')
  const metaDb = useDb('metaObjects')
  const metas = (await metaDb.toArray()) as MetaObject[]
  const objIdToMeta = new Map(metas.filter(i => i.objectId).map(i => [i.objectId, i]))
  const labels = await objDb
    .filter(i => i.specType && ['videoLabel', 'audioLabel', 'pdfLabel', 'webpageLabel'].includes(i.specType))
    .toArray()
  labels.forEach(l => {
    if (!objIdToMeta.has(l.id)) {
      GlobalInstance.metaOps?.addDraggableAsMeta(
        {
          type: l.specType,
          labelId: l.id
        },
        true
      )
    }
  })
}
