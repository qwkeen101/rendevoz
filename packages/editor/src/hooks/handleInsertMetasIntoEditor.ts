import { MetaObject } from '~/typings'
import Id from '../utils/id'

export default (metas: MetaObject[], noteMeta?: MetaObject, inline = true) => {
  const autoBecomeInline = inline
  if (autoBecomeInline) {
    return [
      {
        type: 'paragraph',
        id: Id.getId(),
        children: metas.map(m => ({
          type: 'inline-metaObject',
          originId: m.id,
          id: Id.getId(),
          children: [{ text: '' }]
        }))
      }
    ]
  } else {
    return metas.map(m => {
      if (m.type === 'syncedBlock') {
        return {
          type: 'synced',
          originId: m.id,
          syncVersion: 0,
          children: [{ text: '' }],
          id: Id.getId()
        }
      } else {
        return {
          type: 'metaObject',
          originId: m.id,
          id: Id.getId(),
          children: [{ text: '' }]
        }
      }
    })
  }
}
